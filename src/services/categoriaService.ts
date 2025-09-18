import pool from '../config/databaseConfig';

export interface Categoria {
  id_categoria?: number;
  nome: string;
}

export async function criarCategoria(nome: string): Promise<void> {
  await pool.query('INSERT INTO categorias (nome) VALUES ($1)', [nome]);
}

export async function buscarCategoriasPorNome(nome: string): Promise<Categoria[]> {
  const result = await pool.query('SELECT * FROM categorias WHERE nome ILIKE $1', [`%${nome}%`]);
  return result.rows;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const result = await pool.query('SELECT * FROM categorias');
  return result.rows;
}

export async function deletarCategoria(id_categoria: number): Promise<boolean> {
  // Verifica se a categoria está atrelada a alguma tarefa ou tarefa recorrente
  const tarefa = await pool.query('SELECT 1 FROM tarefa_categoria WHERE id_categoria = $1 LIMIT 1', [id_categoria]);
  const tarefaRecorrente = await pool.query('SELECT 1 FROM tarefa_recorrente_categoria WHERE id_categoria = $1 LIMIT 1', [id_categoria]);
  if ((tarefa.rowCount ?? 0) > 0 || (tarefaRecorrente.rowCount ?? 0) > 0) {
    return false;
  }
  await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id_categoria]);
  return true;
}

export async function atualizarCategoria(id_categoria: number, nome: string): Promise<void> {
  await pool.query('UPDATE categorias SET nome = $1 WHERE id_categoria = $2', [nome, id_categoria]);
}
