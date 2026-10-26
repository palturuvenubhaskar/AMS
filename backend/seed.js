const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

(async () => {
  try {
    console.log('Seeding database from database/seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
    await db.query(seedSql);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
})();
