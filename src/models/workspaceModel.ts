import pool from '../config/databaseConfig';

export async function criarTabelaWorkspace() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workspace (
      id_workspace SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      equipe BOOLEAN DEFAULT false,
      criador VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usuario_workspace (
      id_usuario_workspace SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      id_workspace INTEGER REFERENCES workspace(id_workspace),
      UNIQUE(email, id_workspace)
    );

    CREATE TABLE IF NOT EXISTS tarefa_workspace (
      id_tarefa_workspace SERIAL PRIMARY KEY,
      id_tarefa INTEGER REFERENCES tarefas(id_tarefa),
      id_workspace INTEGER REFERENCES workspace(id_workspace),
      UNIQUE(id_tarefa, id_workspace)
    );
  `);
}
