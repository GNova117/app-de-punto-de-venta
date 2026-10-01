import { NavLink, Outlet } from 'react-router-dom'
import { useAdmin } from '../admin-session'
import AdminLogin from '../components/AdminLogin'

const adminLinks = [
  { to: 'productos', label: 'Productos', icon: '📦' },
  { to: 'categorias', label: 'Categorías', icon: '🏷️' },
  { to: 'movimientos', label: 'Entradas/Salidas', icon: '🔁' },
  { to: 'respaldo', label: 'Respaldo', icon: '💾' },
  { to: 'contrasena', label: 'Contraseña', icon: '🔑' },
]

export default function AdminLayout() {
  const { unlocked, lock } = useAdmin()

  if (!unlocked) return <AdminLogin />

  return (
    <>
      <div className="border-b border-gray-200 bg-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
          <span className="mr-2 hidden shrink-0 text-xs font-semibold tracking-wide text-slate-300 uppercase sm:inline">
            Administración
          </span>
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-white text-slate-900' : 'text-slate-200 hover:bg-slate-700'
                }`
              }
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={lock}
            className="ml-auto shrink-0 rounded-lg border border-slate-500 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-100 hover:bg-slate-700"
          >
            🔒 Cerrar sesión
          </button>
        </div>
      </div>
      <Outlet />
    </>
  )
}
