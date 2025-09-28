import { useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export function OutputToolbar() {
  const { outputs, filter, setFilter, searchTerm, setSearchTerm } = useCodeRunnerStore()
  
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
  
  // 计算过滤后的输出数量
  const filteredCount = useMemo(() => {
    return outputs.filter(output => {
      let matchesFilter = false
      if (filter === 'all') {
        matchesFilter = true
      } else if (filter === 'system') {
        matchesFilter = output.source === 'system'
      } else {
        matchesFilter = output.type === filter && output.source !== 'system'
      }
      
      const matchesSearch = searchTerm === '' || 
        output.message.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    }).length
  }, [outputs, filter, searchTerm])

  return (
    <div className="flex items-center justify-between p-2 border-b bg-muted/20">
      <div className="flex items-center space-x-3">
        {/* 过滤器 */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                全部 ({outputCounts.all})
              </SelectItem>
              <SelectItem value="log">
                日志 ({outputCounts.log})
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
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索输出内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 h-8 pl-8"
          />
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="text-xs text-muted-foreground">
        {searchTerm || filter !== 'all' ? (
          <span>显示 {filteredCount} / {outputs.length} 条</span>
        ) : (
          <span>共 {outputs.length} 条输出</span>
        )}
      </div>
    </div>
  )
}