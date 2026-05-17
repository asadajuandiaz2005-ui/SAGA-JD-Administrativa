import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { routeTree } from './routeTree.gen';
import { QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {  RouterProvider, createRouter } from '@tanstack/react-router'
import { AuthProvider } from './Modules/Auth/Context/AuthContext';
import { AlertContainer } from './Modules/Global/components/Alert/ui/AlertContainer';
import { AlertProvider } from './Modules/Global/context/AlertContext';

function PendingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: PendingFallback,
  defaultPendingMs: 0,
  defaultPendingMinMs: 200,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})
const queryClient = new QueryClient()
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertProvider>
          <RouterProvider router={router} />
          <AlertContainer />
        </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
