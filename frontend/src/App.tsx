import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ConfigPricingLayout } from './components/ConfigPricingLayout'
import { IndustryNews } from './pages/IndustryNews'
import { ConfigPricing } from './pages/ConfigPricing'
import { ModelEdit } from './pages/ModelEdit'
import { SalesAnalysis } from './pages/SalesAnalysis'
import { AppProvider } from './context/AppContext'

/** 根据 modelId 作为 key 强制 remount，确保切换不同车型时正确预填 */
function ModelEditRoute() {
  const location = useLocation()
  const state = location.state as { modelId?: string } | undefined
  return <ModelEdit key={state?.modelId ?? 'new'} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/config-pricing" replace /> },
      { path: 'industry-news', element: <IndustryNews /> },
      {
        path: 'config-pricing',
        element: <ConfigPricingLayout />,
        children: [
          { index: true, element: <ConfigPricing /> },
          { path: 'edit', element: <ModelEditRoute /> },
        ],
      },
      { path: 'sales-analysis', element: <SalesAnalysis /> },
    ],
  },
])

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  )
}

export default App
