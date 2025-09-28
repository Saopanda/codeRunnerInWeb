import { Copy, Download, Trash2, X, CheckSquare, Square } from 'lucide-react'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function OutputActions() {
  const { 
    outputs, 
    selectedOutputs, 
    clearOutputs, 
    clearSelection,
    filter,
    searchTerm
  } = useCodeRunnerStore()
  
  // 获取当前显示的输出（考虑过滤和搜索）
  const getFilteredOutputs = () => {
    return outputs.filter(output => {
      const matchesFilter = filter === 'all' || output.type === filter
      const matchesSearch = searchTerm === '' || 
        output.message.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }

  const copySelectedOutputs = () => {
    if (selectedOutputs.length === 0) {
      toast.error('请先选择要复制的输出')
      return
    }
    
    const selectedData = outputs.filter(o => selectedOutputs.includes(o.id))
    const text = selectedData.map(o => {
      const timestamp = new Date(o.timestamp).toLocaleTimeString()
      return `[${timestamp}] [${o.type.toUpperCase()}] ${o.message}`
    }).join('\n')
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`已复制 ${selectedData.length} 条输出到剪贴板`)
    }).catch(() => {
      toast.error('复制失败，请重试')
    })
  }
  
  const copyAllOutputs = () => {
    if (outputs.length === 0) {
      toast.error('没有输出可复制')
      return
    }
    
    const filteredOutputs = getFilteredOutputs()
    const text = filteredOutputs.map(o => {
      const timestamp = new Date(o.timestamp).toLocaleTimeString()
      return `[${timestamp}] [${o.type.toUpperCase()}] ${o.message}`
    }).join('\n')
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`已复制 ${filteredOutputs.length} 条输出到剪贴板`)
    }).catch(() => {
      toast.error('复制失败，请重试')
    })
  }
  
  const exportOutputs = () => {
    if (outputs.length === 0) {
      toast.error('没有输出可导出')
      return
    }
    
    const filteredOutputs = getFilteredOutputs()
    const data = filteredOutputs.map(o => ({
      timestamp: new Date(o.timestamp).toISOString(),
      type: o.type,
      message: o.message,
      source: o.source
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-runner-output-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`已导出 ${filteredOutputs.length} 条输出`)
  }

  const handleClearOutputs = () => {
    if (outputs.length === 0) {
      toast.error('没有输出可清空')
      return
    }
    
    clearOutputs()
    clearSelection()
    toast.success('已清空所有输出')
  }

  return (
    <div className="flex items-center justify-between p-2 border-t bg-muted/10">
      <div className="flex items-center space-x-1">
        {selectedOutputs.length > 0 ? (
          <>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={copySelectedOutputs}
              className="h-8"
            >
              <Copy className="h-4 w-4 mr-1" />
              复制选中 ({selectedOutputs.length})
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearSelection}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              取消选择
            </Button>
          </>
        ) : (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={copyAllOutputs}
            disabled={outputs.length === 0}
            className="h-8"
          >
            <Copy className="h-4 w-4 mr-1" />
            复制全部
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={exportOutputs}
          disabled={outputs.length === 0}
          className="h-8"
        >
          <Download className="h-4 w-4 mr-1" />
          导出
        </Button>
      </div>
      
      <div className="flex items-center space-x-1">
        <span className="text-xs text-muted-foreground mr-2">
          {getFilteredOutputs().length} / {outputs.length} 条
        </span>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleClearOutputs}
          disabled={outputs.length === 0}
          className="h-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          清空
        </Button>
      </div>
    </div>
  )
}