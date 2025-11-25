import pool from '../config/databaseConfig';

// ====================================
// SERVICE ESPECÍFICO PARA ADMINISTRADOR
// ====================================

// ====================================
// FUNÇÕES DE TAREFAS PARA ADMIN
// ====================================

// Buscar todas as tarefas do sistema (apenas para admin)
export async function buscarTodasTarefasAdmin(): Promise<any[]> {
  const query = `
    SELECT 
      t.id_tarefa,
      t.titulo,
      t.descricao,
      t.data_fim,
      t.prioridade,
      t.status,
      t.concluida,
      t.recorrente,
      t.recorrencia,
      t.data_criacao,
      t.id_usuario,
      u.nome as nome_usuario,
      u.email as email_usuario,
      w.nome as nome_workspace,
      w.id_workspace,
      STRING_AGG(c.nome, ', ') as categorias
    FROM tarefas t
    LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
    LEFT JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    LEFT JOIN workspace w ON tw.id_workspace = w.id_workspace
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    LEFT JOIN categorias c ON tc.id_categoria = c.id_categoria
    GROUP BY t.id_tarefa, u.nome, u.email, w.nome, w.id_workspace
    ORDER BY t.data_criacao DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

// Deletar qualquer tarefa (apenas para admin)
export async function deletarTarefaAdmin(id_tarefa: number): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar se tarefa existe
    const checkResult = await client.query('SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1', [id_tarefa]);
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    
    // Deletar em ordem (devido às foreign keys)
    await client.query('DELETE FROM comentarios WHERE id_tarefa = $1', [id_tarefa]);
    await client.query('DELETE FROM denuncias WHERE id_tarefa = $1', [id_tarefa]);
    await client.query('DELETE FROM tarefa_permissoes WHERE id_tarefa = $1', [id_tarefa]);
    await client.query('DELETE FROM tarefa_categoria WHERE id_tarefa = $1', [id_tarefa]);
    await client.query('DELETE FROM tarefa_workspace WHERE id_tarefa = $1', [id_tarefa]);
    await client.query('DELETE FROM anexo_tarefa WHERE id_tarefa = $1', [id_tarefa]);
    await client.query('DELETE FROM tarefas WHERE id_tarefa = $1', [id_tarefa]);
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ====================================
// FUNÇÕES DE USUÁRIOS PARA ADMIN
// ====================================

// Buscar todos os usuários sem senha (apenas para admin)
export async function buscarTodosUsuariosAdmin(): Promise<any[]> {
  const query = `
    SELECT 
      id_usuario,
      nome,
      email,
      telefone,
      pontos,
      (SELECT COUNT(*) FROM tarefas WHERE id_usuario = u.id_usuario) as total_tarefas,
      (SELECT COUNT(*) FROM tarefas WHERE id_usuario = u.id_usuario AND status = 'concluido') as tarefas_concluidas
    FROM usuarios u
    ORDER BY id_usuario ASC
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

// ====================================
// FUNÇÕES DE DENÚNCIAS PARA ADMIN
// ====================================

// Buscar todas as denúncias do sistema (apenas para admin)
export async function buscarTodasDenunciasAdmin(status?: string): Promise<any[]> {
  let query = `
    SELECT 
      d.id_denuncia,
      d.id_tarefa,
      d.id_usuario_denunciante,
      d.motivo,
      d.status,
      d.data_criacao,
      d.data_analise,
      d.id_moderador,
      d.observacoes_moderador,
      u.nome as nome_denunciante,
      u.email as email_denunciante,
      t.titulo as titulo_tarefa,
      t.descricao as descricao_tarefa,
      t.id_usuario as id_autor_tarefa,
      ua.nome as nome_autor_tarefa,
      ua.email as email_autor_tarefa,
      um.nome as nome_moderador
    FROM denuncias d
    LEFT JOIN usuarios u ON d.id_usuario_denunciante = u.id_usuario
    LEFT JOIN tarefas t ON d.id_tarefa = t.id_tarefa
    LEFT JOIN usuarios ua ON t.id_usuario = ua.id_usuario
    LEFT JOIN usuarios um ON d.id_moderador = um.id_usuario
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

// Atualizar status de denúncia (apenas para admin)
export async function atualizarStatusDenunciaAdmin(
  id_denuncia: number,
  status: string,
  observacoes?: string
): Promise<boolean> {
  const query = `
    UPDATE denuncias 
    SET 
      status = $1,
      data_analise = NOW(),
      id_moderador = 999999,
      observacoes_moderador = $2
    WHERE id_denuncia = $3 AND status = 'pendente'
  `;
  
  const result = await pool.query(query, [
    status,
    observacoes || 'Processado pelo administrador',
    id_denuncia
  ]);
  
  return result.rowCount! > 0;
}

// ====================================
// FUNÇÕES DE ESTATÍSTICAS PARA ADMIN
// ====================================

// Obter estatísticas gerais do sistema
export async function obterEstatisticasGerais(): Promise<any> {
  const queries = [
    // Total de usuários
    'SELECT COUNT(*) as total FROM usuarios',
    
    // Total de tarefas
    'SELECT COUNT(*) as total FROM tarefas',
    
    // Tarefas por status
    `SELECT 
      status, 
      COUNT(*) as quantidade 
     FROM tarefas 
     GROUP BY status`,
    
    // Denúncias por status
    `SELECT 
      status, 
      COUNT(*) as quantidade 
     FROM denuncias 
     GROUP BY status`,
    
    // Top 5 usuários com mais tarefas
    `SELECT 
      u.nome, 
      u.email, 
      COUNT(t.id_tarefa) as total_tarefas 
     FROM usuarios u 
     LEFT JOIN tarefas t ON u.id_usuario = t.id_usuario 
     GROUP BY u.id_usuario, u.nome, u.email 
     ORDER BY total_tarefas DESC 
     LIMIT 5`,
    
    // Tarefas criadas nos últimos 30 dias
    `SELECT COUNT(*) as total 
     FROM tarefas 
     WHERE data_criacao >= NOW() - INTERVAL '30 days'`
  ];
  
  const results = await Promise.all(
    queries.map(query => pool.query(query))
  );
  
  return {
    usuarios: {
      total: parseInt(results[0].rows[0].total)
    },
    tarefas: {
      total: parseInt(results[1].rows[0].total),
      por_status: results[2].rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.quantidade);
        return acc;
      }, {}),
      ultimos_30_dias: parseInt(results[5].rows[0].total)
    },
    denuncias: {
      por_status: results[3].rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.quantidade);
        return acc;
      }, {})
    },
    usuarios_mais_ativos: results[4].rows
  };
}