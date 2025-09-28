import pool from '../config/databaseConfig';

export async function criarTabelaTarefaWorkspace() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarefa_workspace (
      id_tarefa_workspace SERIAL PRIMARY KEY,
      id_tarefa INTEGER REFERENCES tarefas(id_tarefa) ON DELETE CASCADE,
      id_workspace INTEGER REFERENCES workspace(id_workspace) ON DELETE CASCADE,
      UNIQUE(id_tarefa, id_workspace)
    );
  `);
}