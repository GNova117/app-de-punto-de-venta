import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Vender', icon: '🛒', end: true },
  { to: '/productos', label: 'Productos', icon: '📦' },
  { to: '/categorias', label: 'Categorías', icon: '🏷️' },
  { to: '/movimientos', label: 'Entradas/Salidas', icon: '🔁' },
  { to: '/ventas', label: 'Historial de ventas', icon: '🧾' },
  { to: '/corte', label: 'Corte del día', icon: '💰' },
  { to: '/respaldo', label: 'Respaldo', icon: '💾' },
]

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
        <span className="mr-2 shrink-0 text-lg font-bold text-gray-800">🏪 Mi Tienda</span>
        <nav className="flex gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
