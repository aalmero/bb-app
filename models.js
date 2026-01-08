const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  players: [String],
  coach: { type: String, required: true }
});

const scheduleSchema = new mongoose.Schema({
  location: { type: String, required: true },
  date: { type: Date, required: true },
  clubs: [{ type: String, required: true }],
  score: { type: String, default: '' }
});

const standingSchema = new mongoose.Schema({
  club: { type: String, required: true },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
});

const playerStatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  icon: { type: String, default: '🏀' },
  points: { type: Number, default: 0 },
  minutes: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  turnovers: { type: Number, default: 0 }
});

module.exports = {
  Club: mongoose.model('Club', clubSchema),
  Schedule: mongoose.model('Schedule', scheduleSchema),
  TeamStat: mongoose.model('TeamStat', standingSchema),
  PlayerStat: mongoose.model('PlayerStat', playerStatSchema)
};
