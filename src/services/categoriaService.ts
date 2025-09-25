import pool from '../config/databaseConfig';

export interface Categoria {
  id_categoria?: number;
  nome: string;
  cor?: string;
  id_workspace: number;
}

// Função auxiliar para inserir categoria no banco
export async function inserirCategoriaNoBanco(nome: string, cor: string, id_workspace: number): Promise<void> {
  await pool.query(
    'INSERT INTO categorias (nome, cor, id_workspace) VALUES ($1, $2, $3)', 
    [nome, cor, id_workspace]
  );
}

// Função principal de criação
export async function criarCategoria(nome: string, cor: string = '#007acc', id_workspace: number): Promise<void> {
  await inserirCategoriaNoBanco(nome, cor, id_workspace);
}

// Função auxiliar para buscar categorias por workspace com filtro de nome
export async function buscarCategoriasPorWorkspaceEFiltroNome(id_workspace: number, filtroNome: string): Promise<Categoria[]> {
  const result = await pool.query(
    'SELECT * FROM categorias WHERE id_workspace = $1 AND nome ILIKE $2 ORDER BY nome', 
    [id_workspace, `%${filtroNome}%`]
  );
  return result.rows;
}

// Função principal de busca por nome em um workspace
export async function buscarCategoriasPorNomeEWorkspace(nome: string, id_workspace: number): Promise<Categoria[]> {
  return await buscarCategoriasPorWorkspaceEFiltroNome(id_workspace, nome);
}

// Função auxiliar para buscar todas as categorias de um workspace
export async function buscarTodasCategoriasPorWorkspace(id_workspace: number): Promise<Categoria[]> {
  const result = await pool.query(
    'SELECT * FROM categorias WHERE id_workspace = $1 ORDER BY nome', 
    [id_workspace]
  );
  return result.rows;
}

// Função principal de listagem por workspace
export async function listarCategoriasPorWorkspace(id_workspace: number): Promise<Categoria[]> {
  return await buscarTodasCategoriasPorWorkspace(id_workspace);
}

// Função auxiliar para verificar se categoria está em uso
export async function verificarCategoriaEmUso(id_categoria: number): Promise<boolean> {
  const tarefa = await pool.query('SELECT 1 FROM tarefa_categoria WHERE id_categoria = $1 LIMIT 1', [id_categoria]);
  // Como as tarefas recorrentes agora são apenas um campo booleano na tabela tarefas,
  // verificamos se alguma tarefa que usa essa categoria é recorrente
  const tarefaRecorrente = await pool.query(`
    SELECT 1 FROM tarefa_categoria tc 
    JOIN tarefas t ON tc.id_tarefa = t.id_tarefa 
    WHERE tc.id_categoria = $1 AND t.recorrente = true 
    LIMIT 1
  `, [id_categoria]);
  return (tarefa.rowCount ?? 0) > 0 || (tarefaRecorrente.rowCount ?? 0) > 0;
}

// Função auxiliar para verificar se categoria pertence ao workspace
export async function verificarCategoriaPertenceAoWorkspace(id_categoria: number, id_workspace: number): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM categorias WHERE id_categoria = $1 AND id_workspace = $2 LIMIT 1', 
    [id_categoria, id_workspace]
  );
  return (result.rowCount ?? 0) > 0;
}

// Função auxiliar para atualizar categoria no banco
export async function atualizarCategoriaNoBanco(id_categoria: number, nome: string, cor: string, id_workspace: number): Promise<void> {
  await pool.query(
    'UPDATE categorias SET nome = $1, cor = $2 WHERE id_categoria = $3 AND id_workspace = $4', 
    [nome, cor, id_categoria, id_workspace]
  );
}

// Função principal de atualização
export async function atualizarCategoria(id_categoria: number, nome: string, cor: string, id_workspace: number): Promise<void> {
  await atualizarCategoriaNoBanco(id_categoria, nome, cor, id_workspace);
}

// Função auxiliar para deletar categoria do banco (com verificação de workspace)
export async function deletarCategoriaDoBanco(id_categoria: number, id_workspace: number): Promise<void> {
  await pool.query(
    'DELETE FROM categorias WHERE id_categoria = $1 AND id_workspace = $2', 
    [id_categoria, id_workspace]
  );
}

// Função principal de deleção
export async function deletarCategoria(id_categoria: number, id_workspace: number): Promise<boolean> {
  if (await verificarCategoriaEmUso(id_categoria)) {
    return false;
  }
  await deletarCategoriaDoBanco(id_categoria, id_workspace);
  return true;
}
