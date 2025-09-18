import pool from '../config/databaseConfig';

export async function criarTabelaTarefaCategoria() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarefa_categoria (
      id_tarefa_categoria SERIAL PRIMARY KEY,
      id_tarefa INTEGER REFERENCES tarefas(id_tarefa) ON DELETE CASCADE,
      id_categoria INTEGER REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      UNIQUE(id_tarefa, id_categoria)
    );
  `);
}
