const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Club, Schedule, TeamStat, PlayerStat } = require('./models');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/unrival-db');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Basketball CRUD API',
      version: '1.0.0',
      description: 'API for managing basketball schedules, team stats, player stats, and clubs'
    },
    servers: [{ url: 'http://localhost:3000' }]
  },
  apis: ['./server.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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

/**
 * @swagger
 * /clubs/{id}:
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

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
  console.log('API docs available at http://localhost:3000/api-docs');
});
