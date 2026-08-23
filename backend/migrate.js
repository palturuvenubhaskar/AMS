const db = require('./src/config/db');
(async () => {
  try {
    await db.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent'`);
  } catch (e) { console.log(e.message); }
  
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS student_parents (
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        relation VARCHAR(50), 
        PRIMARY KEY (parent_id, student_id)
      )
    `);
  } catch (e) { console.log(e.message); }
  
  console.log('Success');
  process.exit(0);
})();
