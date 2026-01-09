#!/usr/bin/env node

const mongoose = require('mongoose');
const { Club, Schedule, TeamStat, PlayerStat } = require('./models');

// Use environment variable for MongoDB connection, fallback to localhost
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bb-db';

// Connection retry logic for containerized environment
const connectWithRetry = async () => {
  const maxRetries = 15;
  const retryDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Docker Seed] Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries})...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 45000, // 45 second socket timeout
      });
      console.log('[Docker Seed] Successfully connected to MongoDB');
      return;
    } catch (error) {
      console.error(`[Docker Seed] Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('[Docker Seed] Max retries reached. Exiting...');
        process.exit(1);
      }
      
      console.log(`[Docker Seed] Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Check if database already has data
const isDatabaseSeeded = async () => {
  try {
    const clubCount = await Club.countDocuments();
    const scheduleCount = await Schedule.countDocuments();
    const teamStatCount = await TeamStat.countDocuments();
    const playerStatCount = await PlayerStat.countDocuments();
    
    return clubCount > 0 || scheduleCount > 0 || teamStatCount > 0 || playerStatCount > 0;
  } catch (error) {
    console.error('[Docker Seed] Error checking database state:', error);
    return false;
  }
};

const seedData = async () => {
  try {
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    console.log('[Docker Seed] Database connection confirmed, checking if seeding is needed...');

    // Check if database is already seeded
    const alreadySeeded = await isDatabaseSeeded();
    if (alreadySeeded) {
      console.log('[Docker Seed] Database already contains data, skipping seeding');
      process.exit(0);
    }

    console.log('[Docker Seed] Database is empty, starting seeding process...');

    // Clear existing data (just in case)
    console.log('[Docker Seed] Clearing any existing data...');
    await Club.deleteMany({});
    await Schedule.deleteMany({});
    await TeamStat.deleteMany({});
    await PlayerStat.deleteMany({});

    console.log('[Docker Seed] Inserting clubs...');
    const clubs = await Club.insertMany([
      { name: 'Lakers', players: ['LeBron James', 'Anthony Davis', 'Russell Westbrook'], coach: 'Darvin Ham' },
      { name: 'Warriors', players: ['Stephen Curry', 'Klay Thompson', 'Draymond Green'], coach: 'Steve Kerr' },
      { name: 'Celtics', players: ['Jayson Tatum', 'Jaylen Brown', 'Marcus Smart'], coach: 'Joe Mazzulla' },
      { name: 'Heat', players: ['Jimmy Butler', 'Bam Adebayo', 'Tyler Herro'], coach: 'Erik Spoelstra' },
      { name: 'Nuggets', players: ['Nikola Jokic', 'Jamal Murray', 'Aaron Gordon'], coach: 'Michael Malone' }
    ]);

    console.log('[Docker Seed] Inserting schedules...');
    await Schedule.insertMany([
      { location: 'Staples Center', date: new Date('2024-01-15'), clubs: ['Lakers', 'Warriors'], score: '112-108' },
      { location: 'TD Garden', date: new Date('2024-01-16'), clubs: ['Celtics', 'Heat'], score: '105-98' },
      { location: 'Ball Arena', date: new Date('2024-01-17'), clubs: ['Nuggets', 'Lakers'], score: '120-115' },
      { location: 'Chase Center', date: new Date('2024-01-18'), clubs: ['Warriors', 'Celtics'], score: '118-110' },
      { location: 'FTX Arena', date: new Date('2024-01-19'), clubs: ['Heat', 'Nuggets'], score: '102-99' }
    ]);

    console.log('[Docker Seed] Inserting team stats...');
    await TeamStat.insertMany([
      { club: 'Lakers', wins: 25, losses: 15, points: 2100 },
      { club: 'Warriors', wins: 28, losses: 12, points: 2250 },
      { club: 'Celtics', wins: 30, losses: 10, points: 2400 },
      { club: 'Heat', wins: 22, losses: 18, points: 1950 },
      { club: 'Nuggets', wins: 32, losses: 8, points: 2500 }
    ]);

    console.log('[Docker Seed] Inserting player stats...');
    await PlayerStat.insertMany([
      { name: 'LeBron James', team: 'Lakers', icon: '👑', points: 1850, minutes: 2100, gamesPlayed: 40, turnovers: 180 },
      { name: 'Stephen Curry', team: 'Warriors', icon: '🎯', points: 2200, minutes: 1950, gamesPlayed: 40, turnovers: 150 },
      { name: 'Jayson Tatum', team: 'Celtics', icon: '🔥', points: 2100, minutes: 2000, gamesPlayed: 40, turnovers: 160 },
      { name: 'Jimmy Butler', team: 'Heat', icon: '💪', points: 1750, minutes: 1900, gamesPlayed: 40, turnovers: 140 },
      { name: 'Nikola Jokic', team: 'Nuggets', icon: '🃏', points: 2300, minutes: 2200, gamesPlayed: 40, turnovers: 200 }
    ]);

    console.log('[Docker Seed] Database seeded successfully');
    
    // Verify seeded data
    const clubCount = await Club.countDocuments();
    const scheduleCount = await Schedule.countDocuments();
    const teamStatCount = await TeamStat.countDocuments();
    const playerStatCount = await PlayerStat.countDocuments();
    
    console.log('[Docker Seed] Seeded data verification:');
    console.log(`[Docker Seed] - Clubs: ${clubCount}`);
    console.log(`[Docker Seed] - Schedules: ${scheduleCount}`);
    console.log(`[Docker Seed] - Team Stats: ${teamStatCount}`);
    console.log(`[Docker Seed] - Player Stats: ${playerStatCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Docker Seed] Error seeding database:', error);
    process.exit(1);
  }
};

// Initialize connection with retry logic and start seeding
connectWithRetry()
  .then(() => seedData())
  .catch(error => {
    console.error('[Docker Seed] Failed to connect to MongoDB:', error);
    process.exit(1);
  });

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('[Docker Seed] Received SIGINT, closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Docker Seed] Received SIGTERM, closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});