import { BrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Routes, Route, Navigate } from 'react-router-dom'
import { IndustryNews } from './pages/IndustryNews'
import { ConfigPricing } from './pages/ConfigPricing'
import { SalesAnalysis } from './pages/SalesAnalysis'
import { AppProvider } from './context/AppContext'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/config-pricing" replace />} />
            <Route path="/industry-news" element={<IndustryNews />} />
            <Route path="/config-pricing" element={<ConfigPricing />} />
            <Route path="/sales-analysis" element={<SalesAnalysis />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
