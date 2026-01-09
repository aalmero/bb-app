const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Club, Schedule, TeamStat, PlayerStat } = require('./models');

// Load environment configuration
const envConfig = require('./env-config');

const app = express();

// Enhanced logging configuration for container environments
const isProduction = envConfig.get('NODE_ENV') === 'production';
const isDevelopment = envConfig.get('NODE_ENV') === 'development';
const logLevel = envConfig.get('LOG_LEVEL', 'info');
const enableRequestLogging = envConfig.getBool('ENABLE_REQUEST_LOGGING', true);

// Configure logging based on environment
const log = {
  info: (message, ...args) => {
    if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] INFO: ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ERROR: ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] WARN: ${message}`, ...args);
    }
  },
  debug: (message, ...args) => {
    if (logLevel === 'debug') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] DEBUG: ${message}`, ...args);
    }
  }
};

// Request logging middleware for container environments
if (enableRequestLogging) {
  app.use((req, res, next) => {
    const start = Date.now();
    
    // Skip logging for health checks in production to reduce noise
    if (req.path === '/health' && isProduction) {
      return next();
    }
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      log[logLevel](`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    
    next();
  });
}

app.use(express.json());

// Configure CORS with environment-specific origins
const corsOrigins = envConfig.getArray('CORS_ORIGINS', ['http://localhost:3001']);
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Use environment variable for MongoDB connection
const mongoUri = envConfig.get('MONGODB_URI');
const dbMaxPoolSize = envConfig.getInt('DB_MAX_POOL_SIZE', 10);
const dbServerSelectionTimeout = envConfig.getInt('DB_SERVER_SELECTION_TIMEOUT', 5000);
const dbSocketTimeout = envConfig.getInt('DB_SOCKET_TIMEOUT', 45000);

// Connection retry logic for containerized environment
const connectWithRetry = async () => {
  const maxRetries = 10;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.info(`Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries})...`);
      await mongoose.connect(mongoUri, {
        maxPoolSize: dbMaxPoolSize,
        serverSelectionTimeoutMS: dbServerSelectionTimeout,
        socketTimeoutMS: dbSocketTimeout,
      });
      log.info('Successfully connected to MongoDB');
      return;
    } catch (error) {
      log.error(`Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        log.error('Max retries reached. Unable to connect to MongoDB');
        throw error;
      }
      
      log.info(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Initialize connection with retry logic
connectWithRetry().catch(error => {
  log.error('Failed to connect to MongoDB:', error);
  process.exit(1);
});

// Handle connection events with enhanced logging
mongoose.connection.on('connected', () => {
  log.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  log.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  log.warn('Mongoose disconnected from MongoDB');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    log.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    log.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Basketball CRUD API',
      version: '1.0.0',
      description: 'API for managing basketball schedules, team stats, player stats, and clubs'
    },
    servers: [{ 
      url: envConfig.get('API_BASE_URL', 'http://localhost:3000'),
      description: `${envConfig.get('NODE_ENV', 'development')} server`
    }]
  },
  apis: ['./server.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Enhanced health check endpoint for Docker with detailed monitoring
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'basketball-api',
      version: envConfig.get('npm_package_version', '1.0.0'),
      environment: envConfig.get('NODE_ENV', 'development'),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        state: 'unknown',
        healthy: false,
        error: null,
        responseTime: null
      }
    };

    // Check database connection with timing
    const dbStartTime = Date.now();
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    healthStatus.database.state = dbStates[dbState] || 'unknown';
    
    if (dbState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        healthStatus.database.healthy = true;
        healthStatus.database.responseTime = Date.now() - dbStartTime;
      } catch (error) {
        healthStatus.database.error = error.message;
        healthStatus.database.responseTime = Date.now() - dbStartTime;
        healthStatus.status = 'unhealthy';
      }
    } else {
      healthStatus.database.error = `Database is ${healthStatus.database.state}`;
      healthStatus.status = 'unhealthy';
    }
    
    // Add additional health metrics
    const memUsage = process.memoryUsage();
    healthStatus.metrics = {
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      uptime: {
        seconds: Math.round(process.uptime()),
        human: formatUptime(process.uptime())
      }
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    // Log health check failures for monitoring
    if (statusCode !== 200) {
      log.warn('Health check failed', { 
        status: healthStatus.status, 
        dbState: healthStatus.database.state,
        dbError: healthStatus.database.error 
      });
    }
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    log.error('Health check endpoint error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'basketball-api',
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Helper function to format uptime in human-readable format
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Readiness probe endpoint (for Kubernetes-style orchestration)
app.get('/ready', async (req, res) => {
  try {
    // Check if the service is ready to accept traffic
    const dbState = mongoose.connection.readyState;
    
    if (dbState === 1) {
      // Perform a quick database operation to ensure readiness
      await mongoose.connection.db.admin().ping();
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'basketball-api'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        service: 'basketball-api',
        reason: 'Database not connected'
      });
    }
  } catch (error) {
    log.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      service: 'basketball-api',
      error: error.message
    });
  }
});

// Liveness probe endpoint (for Kubernetes-style orchestration)
app.get('/live', (req, res) => {
  // Simple liveness check - if the process is running, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'basketball-api',
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Club:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         players:
 *           type: array
 *           items:
 *             type: string
 *         coach:
 *           type: string
 *     Schedule:
 *       type: object
 *       properties:
 *         location:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         clubs:
 *           type: array
 *           items:
 *             type: string
 *         score:
 *           type: string
 *     TeamStat:
 *       type: object
 *       properties:
 *         club:
 *           type: string
 *         wins:
 *           type: integer
 *         losses:
 *           type: integer
 *         points:
 *           type: integer
 *     PlayerStat:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         team:
 *           type: string
 *         icon:
 *           type: string
 *         points:
 *           type: integer
 *         minutes:
 *           type: integer
 *         gamesPlayed:
 *           type: integer
 *         turnovers:
 *           type: integer
 */

/**
 * @swagger
 * /clubs:
 *   get:
 *     summary: Get all clubs
 *     responses:
 *       200:
 *         description: List of clubs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Club'
 *   post:
 *     summary: Create a club
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Club'
 *     responses:
 *       201:
 *         description: Club created
 */
app.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find();
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clubs', async (req, res) => {
  try {
    const club = new Club(req.body);
    await club.save();
    res.status(201).json(club);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/clubs/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    res.json(club);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /clubs/{id}:
 *   get:
 *     summary: Get a club by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Club found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       404:
 *         description: Club not found
 *   put:
 *     summary: Update a club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Club'
 *     responses:
 *       200:
 *         description: Club updated
 *   delete:
 *     summary: Delete a club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Club deleted
 */
app.put('/clubs/:id', async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(club);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/clubs/:id', async (req, res) => {
  try {
    await Club.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all schedules
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *   post:
 *     summary: Create a schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created
 */
app.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/schedules', async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     summary: Update a schedule
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule updated
 *   delete:
 *     summary: Delete a schedule
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Schedule deleted
 */
app.put('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/schedules/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /team_stats:
 *   get:
 *     summary: Get all team stats
 *     responses:
 *       200:
 *         description: List of standings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Standing'
 *   post:
 *     summary: Create a standing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Standing'
 *     responses:
 *       201:
 *         description: Standing created
 */
app.get('/team_stats', async (req, res) => {
  try {
    const teamStats = await TeamStat.find();
    res.json(teamStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/team_stats', async (req, res) => {
  try {
    const teamStat = new TeamStat(req.body);
    await teamStat.save();
    res.status(201).json(teamStat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /standings/{id}:
 *   put:
 *     summary: Update a standing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Standing'
 *     responses:
 *       200:
 *         description: Standing updated
 *   delete:
 *     summary: Delete a standing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Standing deleted
 */
app.put('/team_stats/:id', async (req, res) => {
  try {
    const teamStat = await TeamStat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(teamStat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/team_stats/:id', async (req, res) => {
  try {
    await TeamStat.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Player Stats CRUD
/**
 * @swagger
 * /player_stats:
 *   get:
 *     summary: Get all player stats
 *     responses:
 *       200:
 *         description: List of player stats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlayerStat'
 *   post:
 *     summary: Create a player stat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlayerStat'
 *     responses:
 *       201:
 *         description: Player stat created
 */
app.get('/player_stats', async (req, res) => {
  try {
    const playerStats = await PlayerStat.find();
    res.json(playerStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/player_stats', async (req, res) => {
  try {
    const playerStat = new PlayerStat(req.body);
    await playerStat.save();
    res.status(201).json(playerStat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /player_stats/{id}:
 *   put:
 *     summary: Update a player stat
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlayerStat'
 *     responses:
 *       200:
 *         description: Player stat updated
 *   delete:
 *     summary: Delete a player stat
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Player stat deleted
 */
app.put('/player_stats/:id', async (req, res) => {
  try {
    const playerStat = await PlayerStat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(playerStat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/player_stats/:id', async (req, res) => {
  try {
    await PlayerStat.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const port = envConfig.getInt('PORT', 3000);
const host = envConfig.get('HOST', '0.0.0.0');

app.listen(port, host, () => {
  log.info('Server starting up...');
  log.info(`Server running on ${host}:${port}`);
  log.info(`API docs available at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api-docs`);
  log.info(`Health check available at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/health`);
  log.info(`Readiness check available at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/ready`);
  log.info(`Liveness check available at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/live`);
  log.info(`Environment: ${envConfig.get('NODE_ENV', 'development')}`);
  log.info(`MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Mask credentials in logs
  log.info(`CORS Origins: ${corsOrigins.join(', ')}`);
});
