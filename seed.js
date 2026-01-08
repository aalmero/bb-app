const mongoose = require('mongoose');
const { Club, Schedule, TeamStat, PlayerStat } = require('./models');

mongoose.connect('mongodb://localhost:27017/unrival-db');

const seedData = async () => {
  await Club.deleteMany({});
  await Schedule.deleteMany({});
  await TeamStat.deleteMany({});
  await PlayerStat.deleteMany({});

  const clubs = await Club.insertMany([
    { name: 'Lakers', players: ['LeBron James', 'Anthony Davis', 'Russell Westbrook'], coach: 'Darvin Ham' },
    { name: 'Warriors', players: ['Stephen Curry', 'Klay Thompson', 'Draymond Green'], coach: 'Steve Kerr' },
    { name: 'Celtics', players: ['Jayson Tatum', 'Jaylen Brown', 'Marcus Smart'], coach: 'Joe Mazzulla' },
    { name: 'Heat', players: ['Jimmy Butler', 'Bam Adebayo', 'Tyler Herro'], coach: 'Erik Spoelstra' },
    { name: 'Nuggets', players: ['Nikola Jokic', 'Jamal Murray', 'Aaron Gordon'], coach: 'Michael Malone' }
  ]);

  await Schedule.insertMany([
    { location: 'Staples Center', date: new Date('2024-01-15'), clubs: ['Lakers', 'Warriors'], score: '112-108' },
    { location: 'TD Garden', date: new Date('2024-01-16'), clubs: ['Celtics', 'Heat'], score: '105-98' },
    { location: 'Ball Arena', date: new Date('2024-01-17'), clubs: ['Nuggets', 'Lakers'], score: '120-115' },
    { location: 'Chase Center', date: new Date('2024-01-18'), clubs: ['Warriors', 'Celtics'], score: '118-110' },
    { location: 'FTX Arena', date: new Date('2024-01-19'), clubs: ['Heat', 'Nuggets'], score: '102-99' }
  ]);

  await TeamStat.insertMany([
    { club: 'Lakers', wins: 25, losses: 15, points: 2100 },
    { club: 'Warriors', wins: 28, losses: 12, points: 2250 },
    { club: 'Celtics', wins: 30, losses: 10, points: 2400 },
    { club: 'Heat', wins: 22, losses: 18, points: 1950 },
    { club: 'Nuggets', wins: 32, losses: 8, points: 2500 }
  ]);

  await PlayerStat.insertMany([
    { name: 'LeBron James', team: 'Lakers', icon: '👑', points: 1850, minutes: 2100, gamesPlayed: 40, turnovers: 180 },
    { name: 'Stephen Curry', team: 'Warriors', icon: '🎯', points: 2200, minutes: 1950, gamesPlayed: 40, turnovers: 150 },
    { name: 'Jayson Tatum', team: 'Celtics', icon: '🔥', points: 2100, minutes: 2000, gamesPlayed: 40, turnovers: 160 },
    { name: 'Jimmy Butler', team: 'Heat', icon: '💪', points: 1750, minutes: 1900, gamesPlayed: 40, turnovers: 140 },
    { name: 'Nikola Jokic', team: 'Nuggets', icon: '🃏', points: 2300, minutes: 2200, gamesPlayed: 40, turnovers: 200 }
  ]);

  console.log('Database seeded successfully');
  process.exit(0);
};

seedData().catch(console.error);
