import { NavLink, Outlet } from 'react-router-dom'
import { useAdmin } from '../admin-session'
import AdminLogin from '../components/AdminLogin'

const adminLinks = [
  { to: 'productos', label: 'Productos', icon: '📦' },
  { to: 'categorias', label: 'Categorías', icon: '🏷️' },
  { to: 'promociones', label: 'Promociones', icon: '🎁' },
  { to: 'ganancias', label: 'Ganancias', icon: '📈' },
  { to: 'movimientos', label: 'Entradas/Salidas', icon: '🔁' },
  { to: 'respaldo', label: 'Respaldo', icon: '💾' },
  { to: 'contrasena', label: 'Contraseña', icon: '🔑' },
]

export default function AdminLayout() {
  const { unlocked, lock } = useAdmin()

  if (!unlocked) return <AdminLogin />

  return (
    <>
      <div className="border-b border-brand-950 bg-brand-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
          <span className="mr-2 hidden shrink-0 text-xs font-semibold tracking-wide text-brand-200 uppercase sm:inline">
            Administración
          </span>
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-cream text-brand-900' : 'text-brand-100 hover:bg-brand-700'
                }`
              }
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={lock}
            className="ml-auto shrink-0 rounded-lg border border-brand-400 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-brand-50 hover:bg-brand-700"
          >
            🔒 Cerrar sesión
          </button>
        </div>
      </div>
      <Outlet />
    </>
  )
}
