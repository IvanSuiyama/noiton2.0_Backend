import pool from '../config/databaseConfig';

export async function criarTabelaTarefasRecorrentes() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarefas_recorrentes (
      id_tarefa_recorrente SERIAL PRIMARY KEY,
      titulo VARCHAR(255) UNIQUE NOT NULL,
      descricao TEXT,
      data_inicio TIMESTAMP,
      data_fim TIMESTAMP,
      prioridade VARCHAR(10) CHECK (prioridade IN ('alta', 'media', 'baixa')),
      concluida BOOLEAN DEFAULT false,
      status VARCHAR(50),
      recorrencia VARCHAR(10) CHECK (recorrencia IN ('dia', 'semana', 'mes'))
    );
  `);
}
