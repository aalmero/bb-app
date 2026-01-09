import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './AppContext'
import { Sidebar } from './Sidebar'
import { ClubsView, SchedulesView, TeamStatsView, PlayerStatsView, PlayerDetailView, ClubDetailView, TeamDetailView } from './Views'

function Dashboard() {
  const { state, dispatch } = useApp()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const [clubsRes, schedulesRes, teamStatsRes, playerStatsRes] = await Promise.all([
          fetch(`${apiUrl}/clubs`),
          fetch(`${apiUrl}/schedules`),
          fetch(`${apiUrl}/team_stats`),
          fetch(`${apiUrl}/player_stats`)
        ])
        
        const clubs = await clubsRes.json()
        const schedules = await schedulesRes.json()
        const teamStats = await teamStatsRes.json()
        const playerStats = await playerStatsRes.json()
        
        dispatch({ type: 'SET_CLUBS', payload: clubs })
        dispatch({ type: 'SET_SCHEDULES', payload: schedules })
        dispatch({ type: 'SET_TEAM_STATS', payload: teamStats })
        dispatch({ type: 'SET_PLAYER_STATS', payload: playerStats })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch data' })
      }
    }
    
    fetchData()
  }, [dispatch])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const getViewTitle = () => {
    switch (state.activeView) {
      case 'clubs': return 'Basketball Clubs'
      case 'schedules': return 'Game Schedules'
      case 'team_stats': return 'Team Statistics'
      case 'player_stats': return 'Player Statistics'
      case 'player_detail': return state.selectedPlayer ? `${state.selectedPlayer.name} Details` : 'Player Details'
      case 'club_detail': return state.selectedClub ? `${state.selectedClub.name} Details` : 'Club Details'
      case 'team_detail': return state.selectedTeam ? `${state.selectedTeam.club} Details` : 'Team Details'
    }
  }
  
  const renderActiveView = () => {
    switch (state.activeView) {
      case 'clubs': return <ClubsView />
      case 'schedules': return <SchedulesView />
      case 'team_stats': return <TeamStatsView />
      case 'player_stats': return <PlayerStatsView />
      case 'player_detail': return <PlayerDetailView />
      case 'club_detail': return <ClubDetailView />
      case 'team_detail': return <TeamDetailView />
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }
  
  return (
    <div className="dashboard">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      />

      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu}
      />
      <main className="main-content">
        <header className="header">
          <h1>{getViewTitle()}</h1>
          <p>Manage your basketball league data</p>
        </header>
        <div className="content-grid">
          {renderActiveView()}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  )
}
