/**
 * Pyodide本地加载器
 * 处理本地Pyodide资源的加载和配置
 */

export interface PyodideConfig {
  indexURL: string
  fullStdLib?: boolean
  packages?: string[]
  packageBaseUrl?: string
}

/**
 * 检测是否支持本地Pyodide
 */
export function isLocalPyodideSupported(): boolean {
  return typeof window !== 'undefined' && window.location.protocol !== 'file:'
}

/**
 * 获取Pyodide配置
 */
export function getPyodideConfig(): PyodideConfig {
  // 优先使用本地资源
  if (isLocalPyodideSupported()) {
    return {
      indexURL: '/pyodide/',
      fullStdLib: false,
      // 包从CDN加载以避免SRI错误
      packageBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
      packages: ['numpy', 'pandas', 'matplotlib']
    }
  }
  
  // 回退到CDN
  return {
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
    fullStdLib: false,
    packages: ['numpy', 'pandas', 'matplotlib']
  }
}

/**
 * 预加载Pyodide资源
 */
export async function preloadPyodideResources(): Promise<void> {
  if (typeof window === 'undefined') return

  const config = getPyodideConfig()
  
  // 预加载关键资源
  const resources = [
    `${config.indexURL}pyodide.js`,
    `${config.indexURL}pyodide.asm.wasm`,
    `${config.indexURL}python_stdlib.zip`
  ]

  try {
    await Promise.all(
      resources.map(resource => 
        fetch(resource, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              // eslint-disable-next-line no-console
              console.warn(`Pyodide资源加载失败: ${resource}`)
            }
            return response
          })
      )
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Pyodide资源预加载失败:', error)
  }
}

/**
 * 检查Pyodide资源可用性
 */
export async function checkPyodideResources(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const config = getPyodideConfig()
  
  try {
    const response = await fetch(`${config.indexURL}pyodide.js`, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Pyodide资源检查失败:', error)
    return false
  }
}
