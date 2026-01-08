# Basketball CRUD API & Dashboard

A complete basketball management system with REST API backend and React 19 dashboard frontend.

## Backend Setup
```bash
npm install
node seed.js  # Populate database
npm start     # Start API server on port 3000
```

## Frontend Setup
```bash
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19 @vitejs/plugin-react@4 typescript@5 vite@5
npx vite --port 3001  # Start dashboard on port 3001
```

## Features 

### Backend API
- **OpenAPI Documentation**: Available at `http://localhost:3000/api-docs`
- **MongoDB Integration**: Uses `unrival-db` database
- **Full CRUD Operations**: Create, Read, Update, Delete for all entities

### Frontend Dashboard
- **React 19**: Latest React with modern patterns
- **TypeScript**: Full type safety
- **Modern UI**: Glassmorphism design with responsive layout
- **State Management**: useReducer + Context API pattern
- **Real-time Data**: Fetches from backend API

## API Endpoints

### Clubs
- `GET /clubs` - Get all clubs
- `POST /clubs` - Create club
- `PUT /clubs/:id` - Update club
- `DELETE /clubs/:id` - Delete club

### Schedules
- `GET /schedules` - Get all schedules
- `POST /schedules` - Create schedule
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule

### Team Stats
- `GET /team_stats` - Get all team stats
- `POST /team_stats` - Create team stat
- `PUT /team_stats/:id` - Update team stat
- `DELETE /team_stats/:id` - Delete team stat

### Player Stats
- `GET /player_stats` - Get all player stats
- `POST /player_stats` - Create player stat
- `PUT /player_stats/:id` - Update player stat
- `DELETE /player_stats/:id` - Delete player stat

## Data Models

**Club**: `{ name, players[], coach }`
**Schedule**: `{ location, date, clubs[], score }`
**TeamStat**: `{ club, wins, losses, points }`
**PlayerStat**: `{ name, team, icon, points, minutes, gamesPlayed, turnovers }`

## Access Points
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Dashboard**: http://localhost:3001
