import pool from '../config/databaseConfig';

export async function criarTabelaTarefaRecorrenteCategoria() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarefa_recorrente_categoria (
      id_tarefa_recorrente_categoria SERIAL PRIMARY KEY,
      id_tarefa_recorrente INTEGER REFERENCES tarefas_recorrentes(id_tarefa_recorrente) ON DELETE CASCADE,
      id_categoria INTEGER REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      UNIQUE(id_tarefa_recorrente, id_categoria)
    );
  `);
}
