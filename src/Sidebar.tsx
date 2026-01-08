import { useApp } from './AppContext'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { state, dispatch } = useApp()
  
  const menuItems = [
    { id: 'clubs', label: 'Clubs', icon: '🏀' },
    { id: 'schedules', label: 'Schedules', icon: '📅' },
    { id: 'team_stats', label: 'Team Stats', icon: '🏆' },
    { id: 'player_stats', label: 'Player Stats', icon: '⭐' }
  ] as const

  const handleNavClick = (viewId: string) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: viewId })
    // Close mobile menu when navigation item is clicked
    if (onClose) {
      onClose()
    }
  }
  
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo">Basketball Dashboard</div>
      <nav>
        <ul className="nav-menu">
          {menuItems.map(item => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${state.activeView === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
