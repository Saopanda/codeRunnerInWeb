import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { DirectionProvider } from '@/context/direction-provider'
import { FontProvider } from '@/context/font-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { ThemeProvider } from '@/context/theme-provider'
// 调试器已关闭，移除相关导入
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <ThemeProvider>
        <DirectionProvider>
          <FontProvider>
            <LayoutProvider>
              <Outlet />
              <Toaster duration={5000} />
              {/* 调试器已关闭 */}
              {/* {import.meta.env.MODE === 'development' && (
                <>
                  <ReactQueryDevtools buttonPosition='bottom-left' />
                  <TanStackRouterDevtools position='bottom-right' />
                </>
              )} */}
            </LayoutProvider>
          </FontProvider>
        </DirectionProvider>
      </ThemeProvider>
    )
  },
  notFoundComponent: () => <div>页面未找到</div>,
  errorComponent: () => <div>发生错误</div>,
})
