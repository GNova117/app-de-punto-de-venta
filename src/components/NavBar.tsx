import { NavLink } from 'react-router-dom'
import { useAdmin } from '../admin-session'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 rounded-lg px-1.5 py-2 text-sm font-medium whitespace-nowrap transition sm:px-3 ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`

const cashierLinks = [
  { to: '/', label: 'Vender', short: 'Vender', icon: '🛒', end: true },
  { to: '/ventas', label: 'Historial de ventas', short: 'Ventas', icon: '🧾' },
  { to: '/corte', label: 'Corte del día', short: 'Corte', icon: '💰' },
]

function Label({ full, short }: { full: string; short: string }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  )
}

export default function NavBar() {
  const { unlocked } = useAdmin()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-4">
        <span className="mr-2 hidden shrink-0 text-lg font-bold text-gray-800 sm:inline">
          🏪 Mi Tienda
        </span>
        <nav className="flex flex-1 gap-0.5 sm:gap-1">
          {cashierLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              <span className="mr-1">{link.icon}</span>
              <Label full={link.label} short={link.short} />
            </NavLink>
          ))}
          <NavLink to="/admin" className={(state) => `${linkClass(state)} ml-auto`}>
            <span className="mr-1">{unlocked ? '🔓' : '🔒'}</span>
            <Label full="Administración" short="Admin" />
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
