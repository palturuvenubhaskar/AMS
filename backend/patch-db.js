const db = require('./src/config/db');
(async () => {
  try {
    const res = await db.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'");
    console.log("role data_type:", res.rows[0].data_type);
  } catch (e) { console.log(e.message); }
  process.exit(0);
})();
