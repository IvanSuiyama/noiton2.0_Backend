import pool from '../config/databaseConfig';

export interface Workspace {
  id_workspace?: number;
  nome: string;
  equipe: boolean;
  criador: string;
  emails: string[]; // lista de emails dos usuários
}

// Função auxiliar para inserir workspace no banco
export async function inserirWorkspaceNoBanco(workspace: Workspace): Promise<number> {
  const result = await pool.query(
    'INSERT INTO workspace (nome, equipe, criador) VALUES ($1, $2, $3) RETURNING id_workspace',
    [workspace.nome, workspace.equipe, workspace.criador]
  );
  return result.rows[0].id_workspace;
}

export async function atualizarWorkspacePorId(id_workspace: number, dados: Partial<Workspace>): Promise<void> {
  const campos = [];
  const valores = [];
  let idx = 1;
  for (const key in dados) {
    campos.push(`${key} = $${idx}`);
    valores.push((dados as any)[key]);
    idx++;
  }
  if (campos.length === 0) return;
  await pool.query(
    `UPDATE workspace SET ${campos.join(', ')} WHERE id_workspace = $${idx}`,
    [...valores, id_workspace]
  );
}
// Remove um email de um workspace existente
export async function removerEmailNoWorkspace(email: string, id_workspace: number): Promise<void> {
  await pool.query(
    'DELETE FROM usuario_workspace WHERE email = $1 AND id_workspace = $2',
    [email, id_workspace]
  );
}
// Adiciona um novo email a um workspace existente
export async function adicionarEmailNoWorkspace(email: string, id_workspace: number): Promise<void> {
  await pool.query(
    'INSERT INTO usuario_workspace (email, id_workspace) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [email, id_workspace]
  );
}

// Função auxiliar para associar usuários ao workspace
export async function associarUsuariosAoWorkspace(emails: string[], id_workspace: number): Promise<void> {
  for (const email of emails) {
    await pool.query(
      'INSERT INTO usuario_workspace (email, id_workspace) VALUES ($1, $2)',
      [email, id_workspace]
    );
  }
}

// Função principal de criação
export async function criarWorkspace(workspace: Workspace): Promise<void> {
  const id_workspace = await inserirWorkspaceNoBanco(workspace);
  await associarUsuariosAoWorkspace(workspace.emails, id_workspace);
}

// Função auxiliar para buscar workspaces com agregação de emails
export async function buscarWorkspacesComEmailsPorUsuario(email: string): Promise<Workspace[]> {
  const result = await pool.query(
    `SELECT w.id_workspace, w.nome, w.equipe, w.criador,
            ARRAY_AGG(uw.email) as emails
     FROM workspace w
     JOIN usuario_workspace uw ON w.id_workspace = uw.id_workspace
     WHERE w.id_workspace IN (
       SELECT id_workspace FROM usuario_workspace WHERE email = $1
     )
     GROUP BY w.id_workspace, w.nome, w.equipe, w.criador`,
    [email]
  );
  return result.rows;
}

// Função principal de busca por email
export async function buscarWorkspacesPorEmail(email: string): Promise<Workspace[]> {
  return await buscarWorkspacesComEmailsPorUsuario(email);
}

// Função auxiliar de busca por id_workspace

// Busca workspace por id, agregando emails dos membros
export async function buscarWorkspacePorId(id_workspace: number): Promise<Workspace | null> {
  const result = await pool.query(
    `SELECT w.id_workspace, w.nome, w.equipe, w.criador, ARRAY_AGG(uw.email) as emails
     FROM workspace w
     JOIN usuario_workspace uw ON w.id_workspace = uw.id_workspace
     WHERE w.id_workspace = $1
     GROUP BY w.id_workspace, w.nome, w.equipe, w.criador`,
    [id_workspace]
  );
  return result.rows[0] || null;
}


// Função principal de busca por id
export async function buscarWorkspacesPorId(id_workspace: number): Promise<Workspace | null> {
  return await buscarWorkspacePorId(id_workspace);
}



// Função auxiliar para construir query de atualização de workspace
export function construirQueryAtualizacaoWorkspace(dados: Partial<Workspace>, nomeOriginal: string): { query: string, params: any[] } {
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
  params.push(nomeOriginal);
  
  return { query, params };
}

// Função principal de atualização
export async function atualizarWorkspace(nome: string, dados: Partial<Workspace>): Promise<void> {
  const { query, params } = construirQueryAtualizacaoWorkspace(dados, nome);
  await pool.query(query, params);
}

// Função auxiliar para verificar se usuário é criador do workspace
export async function verificarCriadorWorkspacePorId(id_workspace: number, emailLogado: string): Promise<{ isCriador: boolean }> {
  const result = await pool.query('SELECT criador FROM workspace WHERE id_workspace = $1', [id_workspace]);
  if (!result.rows[0]) {
    return { isCriador: false };
  }
  const workspace = result.rows[0];
  return {
    isCriador: workspace.criador === emailLogado
  };
}

// Função auxiliar para remover associações do workspace
export async function removerAssociacoesWorkspace(id_workspace: number): Promise<void> {
  // Primeiro, removemos comentários de todas as tarefas deste workspace
  await pool.query(`
    DELETE FROM comentarios 
    WHERE id_tarefa IN (
      SELECT id_tarefa FROM tarefas WHERE id_workspace = $1
    )
  `, [id_workspace]);
  
  // Remove associações categoria-tarefa
  await pool.query(`
    DELETE FROM tarefa_categoria 
    WHERE id_tarefa IN (
      SELECT id_tarefa FROM tarefas WHERE id_workspace = $1
    )
  `, [id_workspace]);
  
  // Remove responsáveis das tarefas
  await pool.query(`
    DELETE FROM tarefa_responsavel 
    WHERE id_tarefa IN (
      SELECT id_tarefa FROM tarefas WHERE id_workspace = $1
    )
  `, [id_workspace]);
  
  // Remove as tarefas do workspace
  await pool.query('DELETE FROM tarefas WHERE id_workspace = $1', [id_workspace]);
  
  // Remove as categorias do workspace
  await pool.query('DELETE FROM categorias WHERE id_workspace = $1', [id_workspace]);
  
  // Remove associações de usuário-workspace
  await pool.query('DELETE FROM usuario_workspace WHERE id_workspace = $1', [id_workspace]);
}

// Função auxiliar para deletar workspace do banco
export async function deletarWorkspaceDoBanco(id_workspace: number): Promise<void> {
  await pool.query('DELETE FROM workspace WHERE id_workspace = $1', [id_workspace]);
}

// Função principal de deleção
export async function deletarWorkspaceSeCriador(id_workspace: number, emailLogado: string): Promise<boolean> {
  const { isCriador } = await verificarCriadorWorkspacePorId(id_workspace, emailLogado);
  if (!isCriador) {
    return false;
  }
  await removerAssociacoesWorkspace(id_workspace);
  await deletarWorkspaceDoBanco(id_workspace);
  return true;
}
