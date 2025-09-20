import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'SUA URL AQUI',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
