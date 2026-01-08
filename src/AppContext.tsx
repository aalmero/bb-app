import { createContext, useContext, useReducer, ReactNode } from 'react'

interface Club {
  _id: string
  name: string
  players: string[]
  coach: string
}

interface Schedule {
  _id: string
  location: string
  date: string
  clubs: string[]
  score: string
}

interface TeamStat {
  _id: string
  club: string
  wins: number
  losses: number
  points: number
}

interface PlayerStat {
  _id: string
  name: string
  team: string
  icon: string
  points: number
  minutes: number
  gamesPlayed: number
  turnovers: number
}

interface AppState {
  clubs: Club[]
  schedules: Schedule[]
  teamStats: TeamStat[]
  playerStats: PlayerStat[]
  activeView: 'clubs' | 'schedules' | 'team_stats' | 'player_stats' | 'player_detail' | 'club_detail' | 'team_detail'
  selectedPlayer: PlayerStat | null
  selectedClub: Club | null
  selectedTeam: TeamStat | null
  loading: boolean
  error: string | null
}

type AppAction = 
  | { type: 'SET_CLUBS'; payload: Club[] }
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'SET_TEAM_STATS'; payload: TeamStat[] }
  | { type: 'SET_PLAYER_STATS'; payload: PlayerStat[] }
  | { type: 'SET_ACTIVE_VIEW'; payload: 'clubs' | 'schedules' | 'team_stats' | 'player_stats' | 'player_detail' | 'club_detail' | 'team_detail' }
  | { type: 'SET_SELECTED_PLAYER'; payload: PlayerStat | null }
  | { type: 'SET_SELECTED_CLUB'; payload: Club | null }
  | { type: 'SET_SELECTED_TEAM'; payload: TeamStat | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: AppState = {
  clubs: [],
  schedules: [],
  teamStats: [],
  playerStats: [],
  activeView: 'clubs',
  selectedPlayer: null,
  selectedClub: null,
  selectedTeam: null,
  loading: false,
  error: null
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CLUBS':
      return { ...state, clubs: action.payload, loading: false }
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload, loading: false }
    case 'SET_TEAM_STATS':
      return { ...state, teamStats: action.payload, loading: false }
    case 'SET_PLAYER_STATS':
      return { ...state, playerStats: action.payload, loading: false }
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload }
    case 'SET_SELECTED_PLAYER':
      return { ...state, selectedPlayer: action.payload }
    case 'SET_SELECTED_CLUB':
      return { ...state, selectedClub: action.payload }
    case 'SET_SELECTED_TEAM':
      return { ...state, selectedTeam: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
