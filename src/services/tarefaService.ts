import pool from '../config/databaseConfig';

export interface Tarefa {
  id_tarefa?: number;
  titulo: string;
  descricao?: string;
  data_fim?: Date;
  data_criacao?: Date;
  prioridade?: 'alta' | 'media' | 'baixa' | 'urgente';
  status?: 'a_fazer' | 'em_andamento' | 'concluido' | 'atrasada';
  concluida?: boolean;
  recorrente?: boolean;
  id_workspace: number;
  id_usuario?: number;
  responsaveis?: string[]; // lista de emails dos responsáveis
  categorias?: number[]; // lista de ids de categoria
  recorrencia?: 'diaria' | 'semanal' | 'mensal';
}

// Função para criar apenas a tarefa base (sem categorias e responsáveis)
export async function criarTarefaBase(tarefa: Tarefa): Promise<number> {
  const result = await pool.query(
    `INSERT INTO tarefas (titulo, descricao, data_fim, prioridade, status, concluida, recorrente, recorrencia, id_workspace, id_usuario) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_tarefa`,
    [
      tarefa.titulo, 
      tarefa.descricao, 
      tarefa.data_fim, 
      tarefa.prioridade || 'media', 
      tarefa.status || 'a_fazer',
      tarefa.concluida ?? false, 
      tarefa.recorrente ?? false, 
      tarefa.recorrencia,
      tarefa.id_workspace,
      tarefa.id_usuario
    ]
  );
  return result.rows[0].id_tarefa;
}

// Função para associar responsáveis (emails) a uma tarefa
export async function associarResponsaveisATarefa(id_tarefa: number, emails: string[]): Promise<void> {
  for (const email of emails) {
    await pool.query(
      'INSERT INTO tarefa_responsavel (id_tarefa, email) VALUES ($1, $2) ON CONFLICT (id_tarefa, email) DO NOTHING', 
      [id_tarefa, email]
    );
  }
}

// Função para remover responsáveis de uma tarefa
export async function removerResponsavelDaTarefa(id_tarefa: number, email?: string): Promise<void> {
  if (email) {
    // Remove responsável específico
    await pool.query('DELETE FROM tarefa_responsavel WHERE id_tarefa = $1 AND email = $2', [id_tarefa, email]);
  } else {
    // Remove todos os responsáveis da tarefa
    await pool.query('DELETE FROM tarefa_responsavel WHERE id_tarefa = $1', [id_tarefa]);
  }
}

// Função para associar categorias a uma tarefa
export async function associarCategoriasATarefa(id_tarefa: number, categorias: number[]): Promise<void> {
  console.log(`Service: Associando categorias ${categorias} à tarefa ${id_tarefa}`);
  
  for (const id_categoria of categorias) {
    try {
      // Verifica se a associação já existe para evitar duplicatas
      const existeAssociacao = await pool.query(
        'SELECT 1 FROM tarefa_categoria WHERE id_tarefa = $1 AND id_categoria = $2', 
        [id_tarefa, id_categoria]
      );
      
      if (existeAssociacao.rows.length === 0) {
        await pool.query(
          'INSERT INTO tarefa_categoria (id_tarefa, id_categoria) VALUES ($1, $2)', 
          [id_tarefa, id_categoria]
        );
        console.log(`Categoria ${id_categoria} associada à tarefa ${id_tarefa}`);
      } else {
        console.log(`Categoria ${id_categoria} já está associada à tarefa ${id_tarefa}`);
      }
    } catch (error) {
      console.error(`Erro ao associar categoria ${id_categoria} à tarefa ${id_tarefa}:`, error);
      throw error;
    }
  }
}

// Função para remover categorias de uma tarefa
export async function removerCategoriaDaTarefa(id_tarefa: number, id_categoria?: number): Promise<void> {
  if (id_categoria) {
    // Remove categoria específica
    await pool.query('DELETE FROM tarefa_categoria WHERE id_tarefa = $1 AND id_categoria = $2', [id_tarefa, id_categoria]);
  } else {
    // Remove todas as categorias da tarefa
    await pool.query('DELETE FROM tarefa_categoria WHERE id_tarefa = $1', [id_tarefa]);
  }
}

// Função completa para criar tarefa com categorias e responsáveis
export async function criarTarefa(tarefa: Tarefa): Promise<void> {
  const id_tarefa = await criarTarefaBase(tarefa);
  
  if (tarefa.categorias && tarefa.categorias.length > 0) {
    await associarCategoriasATarefa(id_tarefa, tarefa.categorias);
  }
  
  if (tarefa.responsaveis && tarefa.responsaveis.length > 0) {
    await associarResponsaveisATarefa(id_tarefa, tarefa.responsaveis);
  }
}

// Função para buscar tarefas por workspace
export async function buscarTarefasPorWorkspace(id_workspace: number): Promise<Tarefa[]> {
  const result = await pool.query(`
    SELECT 
      t.*,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias,
      COALESCE(
        ARRAY_AGG(DISTINCT tr.email) FILTER (WHERE tr.email IS NOT NULL), 
        ARRAY[]::TEXT[]
      ) as responsaveis
    FROM tarefas t
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    LEFT JOIN tarefa_responsavel tr ON t.id_tarefa = tr.id_tarefa
    WHERE t.id_workspace = $1
    GROUP BY t.id_tarefa
    ORDER BY t.data_criacao DESC
  `, [id_workspace]);
  
  return result.rows;
}

// Função para buscar tarefas por responsável (email) em um workspace
export async function buscarTarefasPorResponsavelEWorkspace(email: string, id_workspace: number): Promise<Tarefa[]> {
  const result = await pool.query(`
    SELECT 
      t.*,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias,
      COALESCE(
        ARRAY_AGG(DISTINCT tr.email) FILTER (WHERE tr.email IS NOT NULL), 
        ARRAY[]::TEXT[]
      ) as responsaveis
    FROM tarefas t
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    LEFT JOIN tarefa_responsavel tr ON t.id_tarefa = tr.id_tarefa
    INNER JOIN tarefa_responsavel tr2 ON t.id_tarefa = tr2.id_tarefa
    WHERE tr2.email = $1 AND t.id_workspace = $2
    GROUP BY t.id_tarefa
    ORDER BY t.data_criacao DESC
  `, [email, id_workspace]);
  
  return result.rows;
}

// Filtros para busca de tarefas em um workspace
export async function buscarTarefasComFiltros(id_workspace: number, filtros: any): Promise<Tarefa[]> {
  let query = `
    SELECT 
      t.*,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias,
      COALESCE(
        ARRAY_AGG(DISTINCT tr.email) FILTER (WHERE tr.email IS NOT NULL), 
        ARRAY[]::TEXT[]
      ) as responsaveis
    FROM tarefas t
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    LEFT JOIN tarefa_responsavel tr ON t.id_tarefa = tr.id_tarefa
  `;
  
  const params: any[] = [id_workspace];
  let joins = '';
  let wheres = ['t.id_workspace = $1'];

  if (filtros.categoria_nome) {
    joins += ' JOIN categorias c ON tc.id_categoria = c.id_categoria';
    wheres.push(`c.nome ILIKE $${params.length + 1}`);
    params.push(`%${filtros.categoria_nome}%`);
  }
  
  if (filtros.titulo) {
    wheres.push(`t.titulo ILIKE $${params.length + 1}`);
    params.push(`%${filtros.titulo}%`);
  }
  
  if (filtros.responsavel_email) {
    joins += ' JOIN tarefa_responsavel tr_filter ON t.id_tarefa = tr_filter.id_tarefa';
    wheres.push(`tr_filter.email = $${params.length + 1}`);
    params.push(filtros.responsavel_email);
  }
  
  if (filtros.data_inicio) {
    wheres.push(`t.data_inicio >= $${params.length + 1}`);
    params.push(filtros.data_inicio);
  }
  
  if (filtros.data_fim) {
    wheres.push(`t.data_fim <= $${params.length + 1}`);
    params.push(filtros.data_fim);
  }
  
  if (filtros.prioridade) {
    wheres.push(`t.prioridade = $${params.length + 1}`);
    params.push(filtros.prioridade);
  }
  
  if (filtros.status) {
    wheres.push(`t.status = $${params.length + 1}`);
    params.push(filtros.status);
  }
  
  if (filtros.palavras_chave) {
    wheres.push(`(t.titulo ILIKE $${params.length + 1} OR t.descricao ILIKE $${params.length + 2})`);
    params.push(`%${filtros.palavras_chave}%`);
    params.push(`%${filtros.palavras_chave}%`);
  }

  query += joins + ' WHERE ' + wheres.join(' AND ') + ' GROUP BY t.id_tarefa ORDER BY t.data_criacao DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
}

export async function buscarTarefaPorTituloEWorkspace(titulo: string, id_workspace: number): Promise<Tarefa | null> {
  const result = await pool.query(`
    SELECT 
      t.*,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias,
      COALESCE(
        ARRAY_AGG(DISTINCT tr.email) FILTER (WHERE tr.email IS NOT NULL), 
        ARRAY[]::TEXT[]
      ) as responsaveis
    FROM tarefas t
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    LEFT JOIN tarefa_responsavel tr ON t.id_tarefa = tr.id_tarefa
    WHERE t.titulo = $1 AND t.id_workspace = $2
    GROUP BY t.id_tarefa
  `, [titulo, id_workspace]);
  
  return result.rows[0] || null;
}

// Função para buscar apenas o ID de uma tarefa pelo título e workspace
export async function buscarIdTarefaPorTituloEWorkspace(titulo: string, id_workspace: number): Promise<number | null> {
  const result = await pool.query('SELECT id_tarefa FROM tarefas WHERE titulo = $1 AND id_workspace = $2', [titulo, id_workspace]);
  return result.rows[0]?.id_tarefa || null;
}

export async function atualizarTarefa(id_tarefa: number, dados: Partial<Tarefa>): Promise<void> {
  let query = 'UPDATE tarefas SET';
  const params: any[] = [];
  let set = [];
  
  if (dados.titulo) {
    set.push('titulo = $' + (params.length + 1));
    params.push(dados.titulo);
  }
  if (dados.descricao !== undefined) {
    set.push('descricao = $' + (params.length + 1));
    params.push(dados.descricao);
  }
  if (dados.data_fim) {
    set.push('data_fim = $' + (params.length + 1));
    params.push(dados.data_fim);
  }
  if (dados.prioridade) {
    set.push('prioridade = $' + (params.length + 1));
    params.push(dados.prioridade);
  }
  if (dados.status) {
    set.push('status = $' + (params.length + 1));
    params.push(dados.status);
  }
  if (typeof dados.concluida === 'boolean') {
    set.push('concluida = $' + (params.length + 1));
    params.push(dados.concluida);
  }
  if (typeof dados.recorrente === 'boolean') {
    set.push('recorrente = $' + (params.length + 1));
    params.push(dados.recorrente);
  }
  if (dados.recorrencia) {
    set.push('recorrencia = $' + (params.length + 1));
    params.push(dados.recorrencia);
  }
  
  if (set.length === 0) return;
  
  query += ' ' + set.join(', ') + ' WHERE id_tarefa = $' + (params.length + 1);
  params.push(id_tarefa);
  
  await pool.query(query, params);
  
  // Atualizar categorias se fornecido
  if (dados.categorias !== undefined) {
    await removerCategoriaDaTarefa(id_tarefa);
    if (dados.categorias.length > 0) {
      await associarCategoriasATarefa(id_tarefa, dados.categorias);
    }
  }
  
  // Atualizar responsáveis se fornecido
  if (dados.responsaveis !== undefined) {
    await removerResponsavelDaTarefa(id_tarefa);
    if (dados.responsaveis.length > 0) {
      await associarResponsaveisATarefa(id_tarefa, dados.responsaveis);
    }
  }
}

// Função para deletar tarefa (verifica se o usuário logado é responsável ou criador do workspace)
export async function deletarTarefaPorId(id_tarefa: number, emailUsuarioLogado: string): Promise<boolean> {
  // Verifica se o usuário é responsável pela tarefa ou criador do workspace
  const result = await pool.query(`
    SELECT t.id_workspace, w.criador
    FROM tarefas t
    JOIN workspace w ON t.id_workspace = w.id_workspace
    LEFT JOIN tarefa_responsavel tr ON t.id_tarefa = tr.id_tarefa
    WHERE t.id_tarefa = $1 AND (tr.email = $2 OR w.criador = $2)
    LIMIT 1
  `, [id_tarefa, emailUsuarioLogado]);

  if (result.rows.length === 0) {
    return false; // Usuário não tem permissão
  }

  // Remove associações primeiro
  await removerCategoriaDaTarefa(id_tarefa);
  await removerResponsavelDaTarefa(id_tarefa);
  
  // Remove comentários da tarefa
  await pool.query('DELETE FROM comentarios WHERE id_tarefa = $1', [id_tarefa]);
  
  // Remove a tarefa
  await pool.query('DELETE FROM tarefas WHERE id_tarefa = $1', [id_tarefa]);
  return true;
}
