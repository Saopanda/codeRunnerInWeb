import { useMemo } from 'react'
import { Search, Terminal, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCodeRunnerStore } from '../stores/code-runner-store'

export function OutputFilters() {
  const {
    outputs,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    displayMode,
    setDisplayMode,
  } = useCodeRunnerStore()

  // 计算各类型输出数量
  const outputCounts = useMemo(() => {
    const counts = {
      all: outputs.length,
      log: 0,
      error: 0,
      warn: 0,
      info: 0,
      system: 0,
    }

    outputs.forEach((output) => {
      if (output.source === 'system') {
        counts.system++
      } else {
        counts[output.type]++
      }
    })

    return counts
  }, [outputs])

  return (
    <div className='flex items-center space-x-2'>
      {/* 显示模式切换 */}
      <div className='flex h-8 items-center rounded-md border'>
        <Button
          variant={displayMode === 'terminal' ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setDisplayMode('terminal')}
          className='h-full rounded-r-none border-0 border-r px-2'
        >
          <Terminal className='mr-1 h-3 w-3' />
          <span className='text-xs'>终端</span>
        </Button>
        <Button
          variant={displayMode === 'page' ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setDisplayMode('page')}
          className='h-full rounded-l-none border-0 px-2'
        >
          <FileText className='mr-1 h-3 w-3' />
          <span className='text-xs'>页面</span>
        </Button>
      </div>

      {/* 过滤器 */}
      <div className='flex items-center'>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger
            size='sm'
            className='border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring w-28 px-2 py-1 text-xs focus:ring-2 focus:ring-offset-2'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部 ({outputCounts.all})</SelectItem>
            <SelectItem value='log'>
              代码执行结果 ({outputCounts.log})
            </SelectItem>
            <SelectItem value='error'>错误 ({outputCounts.error})</SelectItem>
            <SelectItem value='warn'>警告 ({outputCounts.warn})</SelectItem>
            <SelectItem value='info'>信息 ({outputCounts.info})</SelectItem>
            <SelectItem value='system'>
              系统消息 ({outputCounts.system})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 搜索框 */}
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 transform' />
        <Input
          type='text'
          placeholder='搜索输出...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='border-input bg-background placeholder:text-muted-foreground focus:ring-ring h-8 w-32 pl-7 text-xs focus:ring-2 focus:ring-offset-2'
        />
      </div>
    </div>
  )
}
