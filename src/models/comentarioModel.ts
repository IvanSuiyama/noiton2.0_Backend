import pool from '../config/databaseConfig';

export async function criarTabelaComentarios(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS comentarios (
      id_comentario SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      id_tarefa INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (email) REFERENCES usuarios(email),
      FOREIGN KEY (id_tarefa) REFERENCES tarefas(id_tarefa)
    )
  `;
  await pool.query(query);
}