# Project Structure

## Root Level
```
├── server.js              # Express API server with all CRUD endpoints
├── models.js              # Mongoose schemas for all entities
├── seed.js                # Database seeding script
├── package.json           # Backend dependencies and scripts
├── index.html             # Vite entry point for frontend
├── vite.config.ts         # Vite configuration (port 3001)
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## Frontend Structure (`src/`)
```
src/
├── main.tsx               # React 19 entry point with StrictMode
├── App.tsx                # Main dashboard component with routing logic
├── AppContext.tsx         # Global state management (useReducer + Context)
├── Sidebar.tsx            # Navigation sidebar component
├── Views.tsx              # All view components (Clubs, Schedules, Stats, Details)
└── index.css              # Global styles with glassmorphism design
```

## Architecture Patterns

### Backend
- **Single File API**: All CRUD endpoints in `server.js`
- **Model Separation**: Database schemas isolated in `models.js`
- **RESTful Routes**: Standard REST conventions for all entities
- **Swagger Integration**: JSDoc comments generate OpenAPI documentation

### Frontend
- **Context + Reducer**: Global state management without external libraries
- **Component Composition**: Views separated by entity type
- **TypeScript Interfaces**: Strong typing for all data models
- **Responsive Design**: Mobile-first with glassmorphism styling

### Data Flow
1. **API Layer**: Express routes handle HTTP requests
2. **Database Layer**: Mongoose models interact with MongoDB
3. **Frontend State**: Context API manages application state
4. **UI Components**: React components consume and display data

## Key Files
- `server.js`: All API endpoints and Swagger documentation
- `models.js`: Database schema definitions
- `AppContext.tsx`: TypeScript interfaces and state management
- `Views.tsx`: All UI components for different data views