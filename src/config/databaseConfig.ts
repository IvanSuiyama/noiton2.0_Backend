import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'SUA URL AQUI',
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo para fechar conexões ociosas
  connectionTimeoutMillis: 2000, // timeout para conectar
});

// Event listeners para debug
pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o pool');
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexões:', err);
  process.exit(-1);
});

export default pool;
