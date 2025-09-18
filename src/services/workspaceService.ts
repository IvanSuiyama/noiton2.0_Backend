import pool from '../config/databaseConfig';

export interface Workspace {
  id_workspace?: number;
  nome: string;
  equipe: boolean;
  email: string;
}

export async function criarWorkspace(workspace: Workspace): Promise<void> {
  // Cria o workspace
  const result = await pool.query(
    'INSERT INTO workspace (nome, equipe) VALUES ($1, $2) RETURNING id_workspace',
    [workspace.nome, workspace.equipe]
  );
  const id_workspace = result.rows[0].id_workspace;
  // Associa o usuário ao workspace
  await pool.query(
    'INSERT INTO usuario_workspace (email, id_workspace) VALUES ($1, $2)',
    [workspace.email, id_workspace]
  );
}

export async function buscarWorkspacesPorEmail(email: string): Promise<Workspace[]> {
  const result = await pool.query(
    `SELECT w.id_workspace, w.nome, w.equipe, uw.email
     FROM workspace w
     JOIN usuario_workspace uw ON w.id_workspace = uw.id_workspace
     WHERE uw.email = $1`,
    [email]
  );
  return result.rows;
}

export async function buscarWorkspacePorNome(nome: string): Promise<Workspace | null> {
  const result = await pool.query(
    `SELECT w.id_workspace, w.nome, w.equipe, uw.email
     FROM workspace w
     JOIN usuario_workspace uw ON w.id_workspace = uw.id_workspace
     WHERE w.nome = $1`,
    [nome]
  );
  return result.rows[0] || null;
}

export async function atualizarWorkspace(nome: string, dados: Partial<Workspace>): Promise<void> {
  let query = 'UPDATE workspace SET';
  const params: any[] = [];
  let set = [];
  if (dados.nome) {
    set.push('nome = $' + (params.length + 1));
    params.push(dados.nome);
  }
  if (typeof dados.equipe === 'boolean') {
    set.push('equipe = $' + (params.length + 1));
    params.push(dados.equipe);
  }
  query += ' ' + set.join(', ') + ' WHERE nome = $' + (params.length + 1);
  params.push(nome);
  await pool.query(query, params);
}

export async function deletarWorkspaceSePessoal(nome: string): Promise<boolean> {
  // Só deleta se for pessoal
  const result = await pool.query('SELECT equipe, id_workspace FROM workspace WHERE nome = $1', [nome]);
  if (!result.rows[0] || result.rows[0].equipe) {
    return false;
  }
  const id_workspace = result.rows[0].id_workspace;
  // Remove associações
  await pool.query('DELETE FROM usuario_workspace WHERE id_workspace = $1', [id_workspace]);
  await pool.query('DELETE FROM tarefa_workspace WHERE id_workspace = $1', [id_workspace]);
  await pool.query('DELETE FROM workspace WHERE id_workspace = $1', [id_workspace]);
  return true;
}
