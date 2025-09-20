import pool from '../config/databaseConfig';

export interface Comentario {
  id_comentario?: number;
  email: string;
  id_tarefa: number;
  descricao: string;
  data_criacao?: Date;
  data_atualizacao?: Date;
}

// Função auxiliar para inserir comentário no banco
export async function inserirComentarioNoBanco(comentario: Comentario): Promise<void> {
  await pool.query(
    'INSERT INTO comentarios (email, id_tarefa, descricao) VALUES ($1, $2, $3)',
    [comentario.email, comentario.id_tarefa, comentario.descricao]
  );
}

// Função principal de criação
export async function criarComentario(comentario: Comentario): Promise<void> {
  await inserirComentarioNoBanco(comentario);
}

// Função auxiliar para buscar comentários por email
export async function buscarComentariosPorEmailNoBanco(email: string): Promise<Comentario[]> {
  const result = await pool.query(
    'SELECT * FROM comentarios WHERE email = $1 ORDER BY data_criacao DESC',
    [email]
  );
  return result.rows;
}

// Função principal de busca por email
export async function buscarComentariosPorEmail(email: string): Promise<Comentario[]> {
  return await buscarComentariosPorEmailNoBanco(email);
}

// Função auxiliar para buscar comentários por tarefa
export async function buscarComentariosPorTarefaNoBanco(id_tarefa: number): Promise<Comentario[]> {
  const result = await pool.query(
    'SELECT * FROM comentarios WHERE id_tarefa = $1 ORDER BY data_criacao DESC',
    [id_tarefa]
  );
  return result.rows;
}

// Função principal de busca por tarefa
export async function buscarComentariosPorTarefa(id_tarefa: number): Promise<Comentario[]> {
  return await buscarComentariosPorTarefaNoBanco(id_tarefa);
}

// Função auxiliar para buscar comentário por ID
export async function buscarComentarioPorIdNoBanco(id_comentario: number): Promise<Comentario | null> {
  const result = await pool.query(
    'SELECT * FROM comentarios WHERE id_comentario = $1',
    [id_comentario]
  );
  return result.rows[0] || null;
}

// Função principal de busca por ID
export async function buscarComentarioPorId(id_comentario: number): Promise<Comentario | null> {
  return await buscarComentarioPorIdNoBanco(id_comentario);
}

// Função auxiliar para atualizar comentário no banco
export async function atualizarComentarioNoBanco(id_comentario: number, descricao: string): Promise<void> {
  await pool.query(
    'UPDATE comentarios SET descricao = $1, data_atualizacao = CURRENT_TIMESTAMP WHERE id_comentario = $2',
    [descricao, id_comentario]
  );
}

// Função principal de atualização
export async function editarComentario(id_comentario: number, descricao: string): Promise<void> {
  await atualizarComentarioNoBanco(id_comentario, descricao);
}

// Função auxiliar para verificar se usuário é dono do comentário
export async function verificarDonoComentario(id_comentario: number, email: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM comentarios WHERE id_comentario = $1 AND email = $2',
    [id_comentario, email]
  );
  return (result.rowCount ?? 0) > 0;
}

// Função auxiliar para deletar comentário do banco
export async function deletarComentarioDoBanco(id_comentario: number): Promise<void> {
  await pool.query('DELETE FROM comentarios WHERE id_comentario = $1', [id_comentario]);
}

// Função principal de deleção
export async function deletarComentario(id_comentario: number, email: string): Promise<boolean> {
  const isDono = await verificarDonoComentario(id_comentario, email);
  if (!isDono) {
    return false; // Não é dono do comentário
  }
  await deletarComentarioDoBanco(id_comentario);
  return true;
}

// Função auxiliar para buscar todos os comentários
export async function buscarTodosComentarios(): Promise<Comentario[]> {
  const result = await pool.query('SELECT * FROM comentarios ORDER BY data_criacao DESC');
  return result.rows;
}