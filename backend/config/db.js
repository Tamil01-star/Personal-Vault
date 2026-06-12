import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.NEON_DATABASE_URL || 
                         process.env.DATABASE_URL || 
                         'postgresql://neondb_owner:npg_4nAsbOG7Uoth@ep-old-voice-ahmoxnyh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString && connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

// Test connection and auto-initialize tables if missing
const initDb = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("Database connection successful at:", res.rows[0].now);

    // Check if tables exist
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (tablesRes.rows.length === 0) {
      console.log("No tables found. Initializing database schema...");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const schemaPath = path.join(__dirname, '../db_schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log("Database schema initialized successfully (all tables created).");
      } else {
        console.warn("WARNING: db_schema.sql not found at:", schemaPath);
      }
    } else {
      console.log("Database tables verified:", tablesRes.rows.map(r => r.table_name).join(', '));
    }
  } catch (err) {
    console.error("Database connection or initialization test failed:", err.message);
  }
};

initDb();

export default pool;
