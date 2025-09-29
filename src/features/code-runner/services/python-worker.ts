/*
  Dedicated Worker to host Pyodide execution.
  Responsibilities:
  - Initialize Pyodide inside worker
  - Redirect stdout/stderr and print to UI via postMessage
  - Apply security restrictions (block dangerous modules, allow sys/os)
  - Execute code with runPythonAsync
  - Format and forward uncaught exceptions via sys.excepthook
  - Optionally load Python packages on demand
*/

interface InitMessage {
  type: 'INIT'
  payload: {
    pyodideConfig: {
      indexURL: string
      fullStdLib?: boolean
      packages?: string[]
      packageBaseUrl?: string
    }
    maxRecursionDepth?: number
  }
}

interface ExecuteMessage {
  type: 'EXECUTE'
  payload: {
    executionId: string
    code: string
    timeoutMs?: number
  }
}

interface LoadPackageMessage {
  type: 'LOAD_PACKAGE'
  payload: { name: string }
}

interface StopMessage {
  type: 'STOP'
}

type InMessage = InitMessage | ExecuteMessage | LoadPackageMessage | StopMessage

type OutMessage =
  | { type: 'READY' }
  | {
      type: 'OUTPUT'
      payload: {
        outputType: 'log' | 'error' | 'warn' | 'info'
        message: string
      }
    }
  | { type: 'RESULT'; payload: { executionId: string; result: string } }
  | { type: 'ERROR'; payload: { executionId?: string; error: string } }
  | { type: 'COMPLETE'; payload: { executionId: string } }
  | { type: 'PACKAGE_LOADED'; payload: { name: string } }

interface PyodideLike {
  globals: {
    set(
      name: string,
      fn: (text: string, outputType: 'log' | 'error' | 'warn' | 'info') => void
    ): void
  }
  runPythonAsync: (code: string) => Promise<unknown>
  runPython: (code: string) => unknown
  loadPackage: (name: string) => Promise<void>
  ffi?: { toJs?: (x: unknown) => unknown }
}

let pyodide: PyodideLike | null = null
let isReady = false
// currentExecutionId 目前仅用于占位，可在扩展中用于取消/追踪
/* @__PURE__ */ let currentExecutionId: string | null = null
void currentExecutionId
let terminated = false

function post(message: OutMessage) {
  postMessage(message)
}

async function initializePyodide(
  config: InitMessage['payload']
): Promise<void> {
  if (isReady) return

  try {
    const { loadPyodide } = await import('pyodide')
    pyodide = (await loadPyodide(
      config.pyodideConfig
    )) as unknown as PyodideLike

    // 安全限制：不屏蔽 sys/os；屏蔽高风险模块与 js 桥
    pyodide.runPython(`
import sys
import builtins

blocked_modules = set([
    'subprocess','socket','urllib','http','ftplib',
    'smtplib','poplib','telnetlib','imaplib','nntplib',
    'webbrowser','multiprocessing','threading','asyncio',
    'js','importlib.resources'
])

original_import = builtins.__import__
def restricted_import(name, *args, **kwargs):
    if name in blocked_modules:
        raise ImportError(f"模块 '{name}' 被安全策略禁止")
    return original_import(name, *args, **kwargs)

builtins.__import__ = restricted_import

if ${String(Number(!!config.maxRecursionDepth))}:
    try:
        sys.setrecursionlimit(${String(config.maxRecursionDepth ?? 1000)})
    except Exception:
        pass
`)

    // 输出重定向 + print 重写
    pyodide.globals.set(
      '_send_output',
      (text: string, outputType: 'log' | 'error' | 'warn' | 'info') => {
        post({
          type: 'OUTPUT',
          payload: { outputType, message: String(text).trim() },
        })
      }
    )

    pyodide.runPython(`
import sys
import io
import builtins
import warnings

class OutputCapture:
    def __init__(self, output_type='log'):
        self.output_type = output_type
        self.buffer = io.StringIO()
    def write(self, text):
        if text:
            self.buffer.write(text)
            _send_output(text, self.output_type)
    def flush(self):
        pass

stdout_capture = OutputCapture('log')
stderr_capture = OutputCapture('error')
original_stdout = sys.stdout
original_stderr = sys.stderr
sys.stdout = stdout_capture
sys.stderr = stderr_capture

original_print = builtins.print
def custom_print(*args, sep=' ', end='\\n', file=None, flush=False):
    output_text = sep.join(str(arg) for arg in args) + end
    _send_output(output_text, 'log')
builtins.print = custom_print

def _ui_excepthook(exc_type, exc_value, exc_traceback):
    import traceback
    try:
        formatted = ''.join(traceback.format_exception(exc_type, exc_value, exc_traceback))
        _send_output(formatted, 'error')
    except Exception as _e:
        _send_output(f'未捕获异常，但格式化失败: {_e}', 'error')
sys.excepthook = _ui_excepthook

def _ui_showwarning(message, category, filename, lineno, file=None, line=None):
    try:
        _send_output(warnings.formatwarning(message, category, filename, lineno, line), 'warn')
    except Exception as _e:
        _send_output(f'警告格式化失败: {_e}', 'warn')
warnings.showwarning = _ui_showwarning
`)

    isReady = true
    post({ type: 'READY' })
  } catch (e) {
    post({
      type: 'ERROR',
      payload: { error: e instanceof Error ? e.message : String(e) },
    })
  }
}

async function executeCode(
  executionId: string,
  code: string,
  timeoutMs?: number
): Promise<void> {
  if (!isReady || !pyodide) {
    post({
      type: 'ERROR',
      payload: { executionId, error: 'Python 环境未初始化' },
    })
    return
  }

  currentExecutionId = executionId
  try {
    const cleanCode = (code || '').trim() || '# Python代码\n'
    const runPromise = pyodide.runPythonAsync(cleanCode)

    let result: unknown
    if (timeoutMs && timeoutMs > 0) {
      result = await Promise.race([
        runPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Python代码执行超时')), timeoutMs)
        ),
      ])
    } else {
      result = await runPromise
    }

    if (terminated) return

    if (typeof result !== 'undefined' && result !== null) {
      let text = ''
      try {
        const toJs = pyodide.ffi?.toJs
        text = toJs ? JSON.stringify(toJs(result), null, 2) : String(result)
      } catch (_e) {
        text = String(result)
      }
      post({ type: 'RESULT', payload: { executionId, result: text } })
    }
    post({ type: 'COMPLETE', payload: { executionId } })
  } catch (e) {
    if (terminated) return
    post({
      type: 'ERROR',
      payload: {
        executionId,
        error: e instanceof Error ? e.message : String(e),
      },
    })
  } finally {
    currentExecutionId = null
  }
}

self.onmessage = async (ev: MessageEvent<InMessage>) => {
  const msg = ev.data
  if (!msg) return
  switch (msg.type) {
    case 'INIT':
      terminated = false
      await initializePyodide(msg.payload)
      break
    case 'EXECUTE':
      await executeCode(
        msg.payload.executionId,
        msg.payload.code,
        msg.payload.timeoutMs
      )
      break
    case 'LOAD_PACKAGE':
      try {
        if (!pyodide) throw new Error('Pyodide 未初始化')
        await pyodide.loadPackage(msg.payload.name)
        post({ type: 'PACKAGE_LOADED', payload: { name: msg.payload.name } })
      } catch (e) {
        post({
          type: 'ERROR',
          payload: { error: e instanceof Error ? e.message : String(e) },
        })
      }
      break
    case 'STOP':
      // 主线程会 terminate 此 worker，这里只做标记
      terminated = true
      currentExecutionId = null
      break
  }
}

export {}
