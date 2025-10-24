import pool from '../config/databaseConfig';

export async function criarTabelaDenuncia() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS denuncias (
      id_denuncia SERIAL PRIMARY KEY,
      id_tarefa INTEGER NOT NULL REFERENCES tarefas(id_tarefa) ON DELETE CASCADE,
      id_usuario_denunciante INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      motivo TEXT NOT NULL,
      status VARCHAR(20) CHECK (status IN ('pendente', 'analisada', 'rejeitada', 'aprovada')) DEFAULT 'pendente',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_analise TIMESTAMP,
      id_moderador INTEGER REFERENCES usuarios(id_usuario),
      observacoes_moderador TEXT,
      UNIQUE(id_tarefa, id_usuario_denunciante)
    );
  `);
}