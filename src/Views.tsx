import { useApp } from './AppContext'

export function ClubsView() {
  const { state, dispatch } = useApp()
  
  if (state.loading) return <div className="loading">Loading clubs...</div>
  if (state.error) return <div className="error">{state.error}</div>

  const handleClubClick = (club: any) => {
    dispatch({ type: 'SET_SELECTED_CLUB', payload: club })
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'club_detail' })
  }
  
  return (
    <div className="card">
      <h2>Basketball Clubs</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Club Name</th>
            <th>Coach</th>
            <th>Players</th>
          </tr>
        </thead>
        <tbody>
          {state.clubs.map(club => (
            <tr key={club._id} onClick={() => handleClubClick(club)} style={{ cursor: 'pointer' }}>
              <td><strong>{club.name}</strong></td>
              <td>{club.coach}</td>
              <td>{club.players.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SchedulesView() {
  const { state } = useApp()
  
  if (state.loading) return <div className="loading">Loading schedules...</div>
  if (state.error) return <div className="error">{state.error}</div>
  
  return (
    <div className="card">
      <h2>Game Schedules</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Location</th>
            <th>Teams</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {state.schedules.map(schedule => (
            <tr key={schedule._id}>
              <td>{new Date(schedule.date).toLocaleDateString()}</td>
              <td>{schedule.location}</td>
              <td>{schedule.clubs.join(' vs ')}</td>
              <td><strong>{schedule.score}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TeamStatsView() {
  const { state, dispatch } = useApp()
  
  if (state.loading) return <div className="loading">Loading team stats...</div>
  if (state.error) return <div className="error">{state.error}</div>

  const handleTeamClick = (team: any) => {
    dispatch({ type: 'SET_SELECTED_TEAM', payload: team })
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'team_detail' })
  }
  
  return (
    <div className="card">
      <h2>Team Statistics</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Club</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {state.teamStats
            .sort((a, b) => b.points - a.points)
            .map(teamStat => (
            <tr key={teamStat._id} onClick={() => handleTeamClick(teamStat)} style={{ cursor: 'pointer' }}>
              <td><strong>{teamStat.club}</strong></td>
              <td>{teamStat.wins}</td>
              <td>{teamStat.losses}</td>
              <td><strong>{teamStat.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PlayerStatsView() {
  const { state, dispatch } = useApp()
  
  if (state.loading) return <div className="loading">Loading player stats...</div>
  if (state.error) return <div className="error">{state.error}</div>

  const handlePlayerClick = (player: any) => {
    dispatch({ type: 'SET_SELECTED_PLAYER', payload: player })
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'player_detail' })
  }
  
  return (
    <div className="card">
      <h2>Player Statistics</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Team</th>
            <th>Points</th>
            <th>Minutes</th>
            <th>Games</th>
            <th>Turnovers</th>
          </tr>
        </thead>
        <tbody>
          {state.playerStats
            .sort((a, b) => b.points - a.points)
            .map(playerStat => (
            <tr key={playerStat._id} onClick={() => handlePlayerClick(playerStat)} style={{ cursor: 'pointer' }}>
              <td><span>{playerStat.icon}</span> <strong>{playerStat.name}</strong></td>
              <td>{playerStat.team}</td>
              <td><strong>{playerStat.points}</strong></td>
              <td>{playerStat.minutes}</td>
              <td>{playerStat.gamesPlayed}</td>
              <td>{playerStat.turnovers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PlayerDetailView() {
  const { state, dispatch } = useApp()
  
  if (!state.selectedPlayer) return <div className="error">No player selected</div>

  const player = state.selectedPlayer
  const avgPointsPerGame = (player.points / player.gamesPlayed).toFixed(1)
  const avgMinutesPerGame = (player.minutes / player.gamesPlayed).toFixed(1)
  const turnoverRate = ((player.turnovers / player.gamesPlayed) * 100).toFixed(1)

  const handleBack = () => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'player_stats' })
    dispatch({ type: 'SET_SELECTED_PLAYER', payload: null })
  }
  
  return (
    <div className="card">
      <button onClick={handleBack} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        ← Back to Players
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '80px', height: '80px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
          {player.icon}
        </div>
        <h2 style={{ margin: 0 }}>{player.name} - Detailed Stats</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Basic Info</h3>
          <p><strong>Team:</strong> {player.team}</p>
          <p><strong>Games Played:</strong> {player.gamesPlayed}</p>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Scoring</h3>
          <p><strong>Total Points:</strong> {player.points}</p>
          <p><strong>Avg Points/Game:</strong> {avgPointsPerGame}</p>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Playing Time</h3>
          <p><strong>Total Minutes:</strong> {player.minutes}</p>
          <p><strong>Avg Minutes/Game:</strong> {avgMinutesPerGame}</p>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Ball Handling</h3>
          <p><strong>Total Turnovers:</strong> {player.turnovers}</p>
          <p><strong>Turnover Rate:</strong> {turnoverRate}%</p>
        </div>
      </div>
    </div>
  )
}

export function ClubDetailView() {
  const { state, dispatch } = useApp()
  
  if (!state.selectedClub) return <div className="error">No club selected</div>

  const club = state.selectedClub

  const handleBack = () => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'clubs' })
    dispatch({ type: 'SET_SELECTED_CLUB', payload: null })
  }
  
  return (
    <div className="card">
      <button onClick={handleBack} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        ← Back to Clubs
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '80px', height: '80px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
          🏀
        </div>
        <h2 style={{ margin: 0 }}>{club.name} - Club Details</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Club Info</h3>
          <p><strong>Name:</strong> {club.name}</p>
          <p><strong>Coach:</strong> {club.coach}</p>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Roster</h3>
          <p><strong>Total Players:</strong> {club.players.length}</p>
          <div style={{ marginTop: '0.5rem' }}>
            {club.players.map((player, index) => (
              <div key={index} style={{ padding: '0.25rem 0', borderBottom: index < club.players.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                {player}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TeamDetailView() {
  const { state, dispatch } = useApp()
  
  if (!state.selectedTeam) return <div className="error">No team selected</div>

  const team = state.selectedTeam
  const totalGames = team.wins + team.losses
  const winRate = totalGames > 0 ? ((team.wins / totalGames) * 100).toFixed(1) : '0.0'
  const avgPointsPerGame = totalGames > 0 ? (team.points / totalGames).toFixed(1) : '0.0'

  const handleBack = () => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'team_stats' })
    dispatch({ type: 'SET_SELECTED_TEAM', payload: null })
  }
  
  return (
    <div className="card">
      <button onClick={handleBack} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        ← Back to Teams
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '80px', height: '80px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
          🏆
        </div>
        <h2 style={{ margin: 0 }}>{team.club} - Team Stats</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Record</h3>
          <p><strong>Wins:</strong> {team.wins}</p>
          <p><strong>Losses:</strong> {team.losses}</p>
          <p><strong>Total Games:</strong> {totalGames}</p>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Performance</h3>
          <p><strong>Win Rate:</strong> {winRate}%</p>
          <p><strong>Total Points:</strong> {team.points}</p>
          <p><strong>Avg Points/Game:</strong> {avgPointsPerGame}</p>
        </div>
      </div>
    </div>
  )
}
