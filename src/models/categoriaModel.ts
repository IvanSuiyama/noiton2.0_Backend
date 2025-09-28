import pool from '../config/databaseConfig';

export async function criarTabelaCategorias() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id_categoria SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      id_workspace INTEGER NOT NULL REFERENCES workspace(id_workspace) ON DELETE CASCADE,
      UNIQUE(nome, id_workspace)
    );
  `);
}
