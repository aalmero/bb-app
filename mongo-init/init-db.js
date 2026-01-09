// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

print('Starting MongoDB initialization for bb-db...');

// Switch to the bb-db database
db = db.getSiblingDB('bb-db');

print('Creating collections with validation rules...');

// Create collections with basic validation
try {
  db.createCollection('clubs', {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name"],
        properties: {
          name: {
            bsonType: "string",
            description: "must be a string and is required"
          },
          players: {
            bsonType: "array",
            description: "must be an array"
          },
          coach: {
            bsonType: "string",
            description: "must be a string"
          }
        }
      }
    }
  });
  print('✓ Created clubs collection with validation');
} catch (e) {
  print('⚠ Clubs collection may already exist: ' + e.message);
}

try {
  db.createCollection('schedules', {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["location", "date"],
        properties: {
          location: {
            bsonType: "string",
            description: "must be a string and is required"
          },
          date: {
            bsonType: "date",
            description: "must be a date and is required"
          },
          clubs: {
            bsonType: "array",
            description: "must be an array"
          },
          score: {
            bsonType: "string",
            description: "must be a string"
          }
        }
      }
    }
  });
  print('✓ Created schedules collection with validation');
} catch (e) {
  print('⚠ Schedules collection may already exist: ' + e.message);
}

try {
  db.createCollection('teamstats', {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["club"],
        properties: {
          club: {
            bsonType: "string",
            description: "must be a string and is required"
          },
          wins: {
            bsonType: "int",
            description: "must be an integer"
          },
          losses: {
            bsonType: "int",
            description: "must be an integer"
          },
          points: {
            bsonType: "int",
            description: "must be an integer"
          }
        }
      }
    }
  });
  print('✓ Created teamstats collection with validation');
} catch (e) {
  print('⚠ TeamStats collection may already exist: ' + e.message);
}

try {
  db.createCollection('playerstats', {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name"],
        properties: {
          name: {
            bsonType: "string",
            description: "must be a string and is required"
          },
          team: {
            bsonType: "string",
            description: "must be a string"
          },
          icon: {
            bsonType: "string",
            description: "must be a string"
          },
          points: {
            bsonType: "int",
            description: "must be an integer"
          },
          minutes: {
            bsonType: "int",
            description: "must be an integer"
          },
          gamesPlayed: {
            bsonType: "int",
            description: "must be an integer"
          },
          turnovers: {
            bsonType: "int",
            description: "must be an integer"
          }
        }
      }
    }
  });
  print('✓ Created playerstats collection with validation');
} catch (e) {
  print('⚠ PlayerStats collection may already exist: ' + e.message);
}

// Create indexes for better performance
print('Creating database indexes...');

try {
  db.clubs.createIndex({ "name": 1 }, { unique: true });
  print('✓ Created unique index on clubs.name');
} catch (e) {
  print('⚠ Index on clubs.name may already exist: ' + e.message);
}

try {
  db.schedules.createIndex({ "date": 1 });
  print('✓ Created index on schedules.date');
} catch (e) {
  print('⚠ Index on schedules.date may already exist: ' + e.message);
}

try {
  db.teamstats.createIndex({ "club": 1 }, { unique: true });
  print('✓ Created unique index on teamstats.club');
} catch (e) {
  print('⚠ Index on teamstats.club may already exist: ' + e.message);
}

try {
  db.playerstats.createIndex({ "name": 1, "team": 1 });
  print('✓ Created compound index on playerstats.name and team');
} catch (e) {
  print('⚠ Index on playerstats may already exist: ' + e.message);
}

// Verify database setup
print('Verifying database setup...');
var collections = db.getCollectionNames();
print('Available collections: ' + collections.join(', '));

print('✅ Database initialization completed successfully for bb-db');
print('📊 Collections created: ' + collections.length);
print('🔍 Indexes created for optimal query performance');
print('✨ Ready for application data seeding');