import pool from '../config/databaseConfig';

export async function criarTabelaTarefas() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarefas (
      id_tarefa SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      data_fim TIMESTAMP,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      prioridade VARCHAR(20) CHECK (prioridade IN ('alta', 'media', 'baixa', 'urgente')) DEFAULT 'media',
      status VARCHAR(50) CHECK (status IN ('a_fazer', 'em_andamento', 'concluido', 'atrasada')) DEFAULT 'a_fazer',
      concluida BOOLEAN DEFAULT false,
      recorrente BOOLEAN DEFAULT false,
      recorrencia VARCHAR(10) CHECK (recorrencia IN ('diaria', 'semanal', 'mensal')),
      id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      UNIQUE(titulo, id_usuario)
    );

  `);
}
