import { useMemo } from 'react'
import { Search, Terminal, FileText } from 'lucide-react'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function OutputFilters() {
  const { outputs, filter, setFilter, searchTerm, setSearchTerm, displayMode, setDisplayMode } = useCodeRunnerStore()
  
  // 计算各类型输出数量
  const outputCounts = useMemo(() => {
    const counts = {
      all: outputs.length,
      log: 0,
      error: 0,
      warn: 0,
      info: 0,
      system: 0
    }
    
    outputs.forEach(output => {
      if (output.source === 'system') {
        counts.system++
      } else {
        counts[output.type]++
      }
    })
    
    return counts
  }, [outputs])

  return (
    <div className="flex items-center space-x-2">
      {/* 显示模式切换 */}
      <div className="flex items-center border rounded-md h-8">
        <Button
          variant={displayMode === 'terminal' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDisplayMode('terminal')}
          className="h-full px-2 rounded-r-none border-r border-0"
        >
          <Terminal className="h-3 w-3 mr-1" />
          <span className="text-xs">终端</span>
        </Button>
        <Button
          variant={displayMode === 'page' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDisplayMode('page')}
          className="h-full px-2 rounded-l-none border-0"
        >
          <FileText className="h-3 w-3 mr-1" />
          <span className="text-xs">页面</span>
        </Button>
      </div>
      
      {/* 过滤器 */}
      <div className="flex items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger size="sm" className="w-28 text-xs border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2 py-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              全部 ({outputCounts.all})
            </SelectItem>
            <SelectItem value="log">
              代码执行结果 ({outputCounts.log})
            </SelectItem>
            <SelectItem value="error">
              错误 ({outputCounts.error})
            </SelectItem>
            <SelectItem value="warn">
              警告 ({outputCounts.warn})
            </SelectItem>
            <SelectItem value="info">
              信息 ({outputCounts.info})
            </SelectItem>
            <SelectItem value="system">
              系统消息 ({outputCounts.system})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜索输出..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-32 h-8 pl-7 text-xs border-input bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
    </div>
  )
}