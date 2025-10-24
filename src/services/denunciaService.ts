import pool from '../config/databaseConfig';

export interface Denuncia {
  id_denuncia?: number;
  id_tarefa: number;
  id_usuario_denunciante: number;
  motivo: string;
  status?: 'pendente' | 'analisada' | 'rejeitada' | 'aprovada';
  data_criacao?: string;
  data_analise?: string;
  id_moderador?: number;
  observacoes_moderador?: string;
}

// Função auxiliar para inserir denúncia no banco
export async function inserirDenunciaNoBanco(denuncia: Denuncia): Promise<number> {
  const result = await pool.query(
    `INSERT INTO denuncias (id_tarefa, id_usuario_denunciante, motivo, status, data_criacao) 
     VALUES ($1, $2, $3, 'pendente', CURRENT_TIMESTAMP) RETURNING id_denuncia`,
    [denuncia.id_tarefa, denuncia.id_usuario_denunciante, denuncia.motivo]
  );
  return result.rows[0].id_denuncia;
}

// Função principal de criação
export async function criarDenuncia(denuncia: Denuncia): Promise<number> {
  return await inserirDenunciaNoBanco(denuncia);
}

// Função auxiliar para verificar se usuário já denunciou tarefa
export async function verificarUsuarioJaDenunciou(id_tarefa: number, id_usuario: number): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM denuncias WHERE id_tarefa = $1 AND id_usuario_denunciante = $2 LIMIT 1',
    [id_tarefa, id_usuario]
  );
  return (result.rowCount ?? 0) > 0;
}

// Função auxiliar para buscar denúncia por ID com informações completas
export async function buscarDenunciaPorIdCompleta(id_denuncia: number): Promise<Denuncia | null> {
  const result = await pool.query(`
    SELECT d.*, 
           t.titulo as titulo_tarefa, 
           u.nome as nome_denunciante,
           m.nome as nome_moderador
    FROM denuncias d
    JOIN tarefas t ON d.id_tarefa = t.id_tarefa
    JOIN usuarios u ON d.id_usuario_denunciante = u.id_usuario
    LEFT JOIN usuarios m ON d.id_moderador = m.id_usuario
    WHERE d.id_denuncia = $1
  `, [id_denuncia]);
  
  return result.rows[0] || null;
}

// Função principal de busca por ID
export async function buscarDenunciaPorId(id_denuncia: number): Promise<Denuncia | null> {
  return await buscarDenunciaPorIdCompleta(id_denuncia);
}

// Função auxiliar para buscar denúncias de uma tarefa
export async function buscarDenunciasPorTarefaCompletas(id_tarefa: number): Promise<Denuncia[]> {
  const result = await pool.query(`
    SELECT d.*, u.nome as nome_denunciante
    FROM denuncias d
    JOIN usuarios u ON d.id_usuario_denunciante = u.id_usuario
    WHERE d.id_tarefa = $1
    ORDER BY d.data_criacao DESC
  `, [id_tarefa]);
  
  return result.rows;
}

// Função principal de busca por tarefa
export async function buscarDenunciasPorTarefa(id_tarefa: number): Promise<Denuncia[]> {
  return await buscarDenunciasPorTarefaCompletas(id_tarefa);
}

// Função auxiliar para buscar todas as denúncias com filtros
export async function buscarTodasDenunciasComFiltro(status?: string): Promise<Denuncia[]> {
  let query = `
    SELECT d.*, 
           t.titulo as titulo_tarefa, 
           u.nome as nome_denunciante,
           m.nome as nome_moderador
    FROM denuncias d
    JOIN tarefas t ON d.id_tarefa = t.id_tarefa
    JOIN usuarios u ON d.id_usuario_denunciante = u.id_usuario
    LEFT JOIN usuarios m ON d.id_moderador = m.id_usuario
  `;
  
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE d.status = $1';
    params.push(status);
  }
  
  query += ' ORDER BY d.data_criacao DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
}

// Função principal de listagem
export async function listarTodasDenuncias(status?: string): Promise<Denuncia[]> {
  return await buscarTodasDenunciasComFiltro(status);
}

// Função auxiliar para atualizar status da denúncia
export async function atualizarStatusDenunciaNoBanco(
  id_denuncia: number,
  status: string,
  id_moderador: number,
  observacoes?: string
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE denuncias 
     SET status = $1, data_analise = CURRENT_TIMESTAMP, id_moderador = $2, observacoes_moderador = $3
     WHERE id_denuncia = $4`,
    [status, id_moderador, observacoes || null, id_denuncia]
  );
  
  return (result.rowCount ?? 0) > 0;
}

// Função principal de atualização de status
export async function atualizarStatusDenuncia(
  id_denuncia: number,
  status: string,
  id_moderador: number,
  observacoes?: string
): Promise<boolean> {
  return await atualizarStatusDenunciaNoBanco(id_denuncia, status, id_moderador, observacoes);
}

// Função auxiliar para contar denúncias por status
export async function contarDenunciasPorStatusNoBanco(): Promise<{ [key: string]: number }> {
  const result = await pool.query(
    'SELECT status, COUNT(*) as count FROM denuncias GROUP BY status'
  );
  
  const stats: { [key: string]: number } = {
    pendente: 0,
    analisada: 0,
    rejeitada: 0,
    aprovada: 0
  };
  
  result.rows.forEach(row => {
    stats[row.status] = parseInt(row.count);
  });
  
  return stats;
}

// Função principal de estatísticas
export async function obterEstatisticasDenuncias(): Promise<{ [key: string]: number }> {
  return await contarDenunciasPorStatusNoBanco();
}

// Função auxiliar para verificar se tarefa existe
export async function verificarTarefaExiste(id_tarefa: number): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM tarefas WHERE id_tarefa = $1 LIMIT 1',
    [id_tarefa]
  );
  return (result.rowCount ?? 0) > 0;
}