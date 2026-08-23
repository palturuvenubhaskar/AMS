const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    await db.query(schema);
    
    // Add default admin if not exists
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('admin@alits.edu.in', $1, 'System Admin', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);

    console.log('Schema executed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error executing schema:', err);
    process.exit(1);
  }
})();
