import { Pool } from 'pg';

const connectionString = 'postgresql://postgres:1234@localhost:5432/Noiton2';
// const connectionString = 'SUA URL AQUI'
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners para debug
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL local');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão PostgreSQL:', err);
});

export default pool;
