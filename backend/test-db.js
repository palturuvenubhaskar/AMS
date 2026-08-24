const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://aams_admin:aams_secure_2026@localhost:5432/aams_frs' });
async function run() {
  const res = await pool.query('SELECT role, email FROM users LIMIT 10;');
  console.log(res.rows);
  pool.end();
}
run();
