import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import { seedDatabase } from './db'
import CategoriesPage from './pages/CategoriesPage'
import DailyCutoffPage from './pages/DailyCutoffPage'
import PosPage from './pages/PosPage'
import ProductsPage from './pages/ProductsPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import StockMovementsPage from './pages/StockMovementsPage'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedDatabase().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Cargando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <Routes>
        <Route path="/" element={<PosPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/movimientos" element={<StockMovementsPage />} />
        <Route path="/ventas" element={<SalesHistoryPage />} />
        <Route path="/corte" element={<DailyCutoffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
