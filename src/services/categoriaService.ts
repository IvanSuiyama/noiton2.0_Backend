import pool from '../config/databaseConfig';

export interface Categoria {
  id_categoria?: number;
  nome: string;
}

// Função auxiliar para inserir categoria no banco
export async function inserirCategoriaNoBanco(nome: string): Promise<void> {
  await pool.query('INSERT INTO categorias (nome) VALUES ($1)', [nome]);
}

// Função principal de criação
export async function criarCategoria(nome: string): Promise<void> {
  await inserirCategoriaNoBanco(nome);
}

// Função auxiliar para buscar categorias com filtro ILIKE
export async function buscarCategoriasPorFiltroNome(filtroNome: string): Promise<Categoria[]> {
  const result = await pool.query('SELECT * FROM categorias WHERE nome ILIKE $1', [`%${filtroNome}%`]);
  return result.rows;
}

// Função principal de busca por nome
export async function buscarCategoriasPorNome(nome: string): Promise<Categoria[]> {
  return await buscarCategoriasPorFiltroNome(nome);
}

// Função auxiliar para buscar todas as categorias
export async function buscarTodasCategorias(): Promise<Categoria[]> {
  const result = await pool.query('SELECT * FROM categorias');
  return result.rows;
}

// Função principal de listagem
export async function listarCategorias(): Promise<Categoria[]> {
  return await buscarTodasCategorias();
}

// Função auxiliar para verificar se categoria está em uso
export async function verificarCategoriaEmUso(id_categoria: number): Promise<boolean> {
  const tarefa = await pool.query('SELECT 1 FROM tarefa_categoria WHERE id_categoria = $1 LIMIT 1', [id_categoria]);
  const tarefaRecorrente = await pool.query('SELECT 1 FROM tarefa_recorrente_categoria WHERE id_categoria = $1 LIMIT 1', [id_categoria]);
  return (tarefa.rowCount ?? 0) > 0 || (tarefaRecorrente.rowCount ?? 0) > 0;
}

// Função auxiliar para deletar categoria do banco
export async function deletarCategoriaDoBanco(id_categoria: number): Promise<void> {
  await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id_categoria]);
}

// Função principal de deleção
export async function deletarCategoria(id_categoria: number): Promise<boolean> {
  if (await verificarCategoriaEmUso(id_categoria)) {
    return false;
  }
  await deletarCategoriaDoBanco(id_categoria);
  return true;
}

// Função auxiliar para atualizar categoria no banco
export async function atualizarCategoriaNoBanco(id_categoria: number, nome: string): Promise<void> {
  await pool.query('UPDATE categorias SET nome = $1 WHERE id_categoria = $2', [nome, id_categoria]);
}

// Função principal de atualização
export async function atualizarCategoria(id_categoria: number, nome: string): Promise<void> {
  await atualizarCategoriaNoBanco(id_categoria, nome);
}
