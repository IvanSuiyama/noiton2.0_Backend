import pool from '../config/databaseConfig';

export async function criarTabelaTarefas() {
  await pool.query(`

    CREATE TABLE IF NOT EXISTS tarefas (
      id_tarefa SERIAL PRIMARY KEY,
      titulo VARCHAR(255) UNIQUE NOT NULL,
      descricao TEXT,
      data_inicio TIMESTAMP,
      data_fim TIMESTAMP,
      prioridade VARCHAR(10) CHECK (prioridade IN ('alta', 'media', 'baixa')),
      concluida BOOLEAN DEFAULT false,
      status VARCHAR(50)
    );
  `);
}
