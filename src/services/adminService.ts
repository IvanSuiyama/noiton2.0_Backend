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
      id_moderador = NULL,
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

// Função auxiliar para deletar tarefa completamente (com cascade manual)
export async function deletarTarefaCompleta(id_tarefa: number, client: any): Promise<void> {
  // Ordem específica para evitar violações de foreign key
  console.log(`🗑️ Iniciando deleção da tarefa ${id_tarefa} e todas suas relações...`);
  
  // 1. Deletar comentários da tarefa
  const comentarios = await client.query('DELETE FROM comentarios WHERE id_tarefa = $1', [id_tarefa]);
  console.log(`📝 Deletados ${comentarios.rowCount} comentários`);
  
  // 2. Deletar outras denúncias relacionadas à mesma tarefa (menos a atual)
  const outrasdenuncias = await client.query('DELETE FROM denuncias WHERE id_tarefa = $1', [id_tarefa]);
  console.log(`🚨 Deletadas ${outrasdenuncias.rowCount} outras denúncias`);
  
  // 3. Deletar permissões da tarefa
  const permissoes = await client.query('DELETE FROM tarefa_permissoes WHERE id_tarefa = $1', [id_tarefa]);
  console.log(`🔐 Deletadas ${permissoes.rowCount} permissões`);
  
  // 4. Deletar relação tarefa-categoria (não deleta a categoria, só a relação)
  const categorias = await client.query('DELETE FROM tarefa_categoria WHERE id_tarefa = $1', [id_tarefa]);
  console.log(`🏷️ Deletadas ${categorias.rowCount} relações com categorias`);
  
  // 5. Deletar relação tarefa-workspace
  const workspace = await client.query('DELETE FROM tarefa_workspace WHERE id_tarefa = $1', [id_tarefa]);
  console.log(`🏢 Deletadas ${workspace.rowCount} relações com workspace`);
  
  // 6. Deletar anexos da tarefa
  try {
    const anexos = await client.query('DELETE FROM anexos_tarefa WHERE id_tarefa = $1', [id_tarefa]);
    console.log(`📎 Deletados ${anexos.rowCount} anexos`);
  } catch (error: any) {
    console.log(`⚠️ Erro ao deletar anexos - Código: ${error.code}, Mensagem: ${error.message}`);
    // Como a tabela tem CASCADE, se não conseguir deletar anexos, pode ser problema
    throw error;
  }
  
  // 7. Finalmente, deletar a tarefa principal
  const tarefa = await client.query('DELETE FROM tarefas WHERE id_tarefa = $1', [id_tarefa]);
  console.log(`✅ Tarefa ${id_tarefa} deletada com sucesso!`);
  
  if (tarefa.rowCount === 0) {
    throw new Error(`Tarefa ${id_tarefa} não foi encontrada para deleção`);
  }
}

// Aprovar denúncia (deleta a tarefa relacionada)
export async function aprovarDenunciaAdmin(id_denuncia: number): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Buscar a tarefa relacionada à denúncia (qualquer status)
    const denunciaResult = await client.query(
      'SELECT id_tarefa, status FROM denuncias WHERE id_denuncia = $1',
      [id_denuncia]
    );
    
    if (denunciaResult.rows.length === 0) {
      console.log(`❌ Denúncia ${id_denuncia} não encontrada`);
      await client.query('ROLLBACK');
      return false;
    }
    
    const { id_tarefa, status } = denunciaResult.rows[0];
    console.log(`🔍 Denúncia ${id_denuncia} encontrada. Tarefa: ${id_tarefa}, Status atual: ${status}`);
    
    // Se já foi aprovada antes, só deleta a tarefa
    if (status === 'aprovada') {
      console.log(`⚠️ Denúncia já estava aprovada. Forçando deleção da tarefa ${id_tarefa}...`);
    } else {
      // Atualizar status da denúncia para 'aprovada'
      await client.query(
        `UPDATE denuncias 
         SET status = 'aprovada', data_analise = NOW(), observacoes_moderador = 'Denúncia aprovada. Tarefa removida pelo administrador', id_moderador = NULL
         WHERE id_denuncia = $1`,
        [id_denuncia]
      );
      console.log(`✅ Status da denúncia ${id_denuncia} atualizado para 'aprovada'`);
    }
    
    // Deletar a tarefa e todos os relacionamentos
    await deletarTarefaCompleta(id_tarefa, client);
    
    await client.query('COMMIT');
    console.log(`🎉 Aprovação da denúncia ${id_denuncia} concluída com sucesso!`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`💥 Erro ao aprovar denúncia ${id_denuncia}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Rejeitar denúncia (deleta apenas a denúncia)
export async function rejeitarDenunciaAdmin(id_denuncia: number): Promise<boolean> {
  const query = `
    DELETE FROM denuncias 
    WHERE id_denuncia = $1 AND status = 'pendente'
  `;
  
  const result = await pool.query(query, [id_denuncia]);
  return result.rowCount! > 0;
}

// Forçar deleção de tarefa (para casos onde denúncia foi aprovada mas tarefa não foi deletada)
export async function forcarDelecaoTarefaAdmin(id_tarefa: number): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar se a tarefa existe
    const tarefaCheck = await client.query('SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1', [id_tarefa]);
    if (tarefaCheck.rows.length === 0) {
      console.log(`❌ Tarefa ${id_tarefa} não encontrada`);
      await client.query('ROLLBACK');
      return false;
    }
    
    console.log(`🔨 Forçando deleção da tarefa ${id_tarefa}...`);
    
    // Usar a função auxiliar para deletar completamente
    await deletarTarefaCompleta(id_tarefa, client);
    
    await client.query('COMMIT');
    console.log(`🎉 Deleção forçada da tarefa ${id_tarefa} concluída!`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`💥 Erro ao forçar deleção da tarefa ${id_tarefa}:`, error);
    throw error;
  } finally {
    client.release();
  }
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