import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import logo from './assets/logo-glam-carpe.png'
import { requestPersistentStorage } from './backup'
import AdminProvider from './components/AdminProvider'
import BackupReminder from './components/BackupReminder'
import NavBar from './components/NavBar'
import { seedDatabase } from './db'
import AdminLayout from './pages/AdminLayout'
import AdminPasswordPage from './pages/AdminPasswordPage'
import BackupPage from './pages/BackupPage'
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
    requestPersistentStorage().catch(() => {})
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <img src={logo} alt="Glam Carpe" className="h-24 animate-pulse" />
      </div>
    )
  }

  return (
    <AdminProvider>
      <div className="min-h-screen bg-cream">
        <NavBar />
        <BackupReminder />
        <Routes>
          <Route path="/" element={<PosPage />} />
          <Route path="/ventas" element={<SalesHistoryPage />} />
          <Route path="/corte" element={<DailyCutoffPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="productos" replace />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="movimientos" element={<StockMovementsPage />} />
            <Route path="respaldo" element={<BackupPage />} />
            <Route path="contrasena" element={<AdminPasswordPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AdminProvider>
  )
}

export default App
