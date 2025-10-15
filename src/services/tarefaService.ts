import pool from '../config/databaseConfig';

export interface Tarefa {
  id_tarefa?: number;
  id_workspace?: number;
  id_usuario?: number;
  titulo: string;
  descricao?: string;
  data_fim?: Date;
  data_criacao?: Date;
  prioridade?: 'alta' | 'media' | 'baixa' | 'urgente';
  status?: 'a_fazer' | 'em_andamento' | 'concluido' | 'atrasada';
  concluida?: boolean;
  recorrente?: boolean;
  recorrencia?: 'diaria' | 'semanal' | 'mensal';
  categorias?: number[]; // lista de ids de categoria
}

export async function criarTarefaBase(tarefa: Tarefa, id_usuario: number): Promise<number> {
  const result = await pool.query(
    `INSERT INTO tarefas (titulo, descricao, data_fim, prioridade, status, concluida, recorrente, recorrencia, id_usuario) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_tarefa`,
    [
      tarefa.titulo, 
      tarefa.descricao, 
      tarefa.data_fim, 
      tarefa.prioridade || 'media', 
      tarefa.status || 'a_fazer',
      tarefa.concluida ?? false, 
      tarefa.recorrente ?? false, 
      tarefa.recorrencia,
      id_usuario  // ✅ Agora recebido como parâmetro separado
    ]
  );
  return result.rows[0].id_tarefa;
}

// Função para associar tarefa a workspace
export async function associarTarefaAWorkspace(id_tarefa: number, id_workspace: number): Promise<void> {
  await pool.query(
    'INSERT INTO tarefa_workspace (id_tarefa, id_workspace) VALUES ($1, $2) ON CONFLICT (id_tarefa, id_workspace) DO NOTHING', 
    [id_tarefa, id_workspace]
  );
}

// Função para remover tarefa de workspace
export async function removerTarefaDeWorkspace(id_tarefa: number, id_workspace?: number): Promise<void> {
  if (id_workspace) {
    // Remove associação específica
    await pool.query('DELETE FROM tarefa_workspace WHERE id_tarefa = $1 AND id_workspace = $2', [id_tarefa, id_workspace]);
  } else {
    // Remove todas as associações da tarefa
    await pool.query('DELETE FROM tarefa_workspace WHERE id_tarefa = $1', [id_tarefa]);
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

export async function criarTarefa(tarefa: Tarefa, id_workspace: number, id_usuario: number): Promise<number> {
  try {
    console.log('✅ 1. Criando tarefa base...');
    const id_tarefa = await criarTarefaBase(tarefa, id_usuario); // ✅ Passar id_usuario
    console.log('✅ Tarefa base criada com ID:', id_tarefa);

    console.log('✅ 2. Associando tarefa ao workspace...');
    await associarTarefaAWorkspace(id_tarefa, id_workspace);
    console.log('✅ Tarefa associada ao workspace');

    if (tarefa.categorias && tarefa.categorias.length > 0) {
      console.log('✅ 3. Associando categorias...', tarefa.categorias);
      await associarCategoriasATarefa(id_tarefa, tarefa.categorias);
      console.log('✅ Categorias associadas');
    } else {
      console.log('✅ 3. Nenhuma categoria para associar');
    }

    console.log('🎉 Tarefa criada com sucesso! ID:', id_tarefa);
    return id_tarefa;
    
  } catch (error) {
    console.error('❌ Erro detalhado na criação da tarefa:', error);
    throw error;
  }
}

export async function buscarTarefasPorWorkspace(id_workspace: number): Promise<Tarefa[]> {
  const result = await pool.query(`
    SELECT 
      t.*,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias
    FROM tarefas t
    INNER JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    WHERE tw.id_workspace = $1
    GROUP BY t.id_tarefa
    ORDER BY t.data_criacao DESC
  `, [id_workspace]);
  
  // ✅ Mapear explicitamente o resultado e forçar o id_workspace
  const tarefasComWorkspace = result.rows.map(row => ({
    ...row,
    id_workspace: id_workspace  // ✅ Garantir que sempre tem o id_workspace
  }));
  
  return tarefasComWorkspace;
}

// Função para buscar tarefas por usuário em um workspace
export async function buscarTarefasPorUsuarioEWorkspace(id_usuario: number, id_workspace: number): Promise<Tarefa[]> {
  const result = await pool.query(`
    SELECT 
      t.*,
      tw.id_workspace,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias
    FROM tarefas t
    INNER JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    WHERE t.id_usuario = $1 AND tw.id_workspace = $2
    GROUP BY t.id_tarefa, tw.id_workspace
    ORDER BY t.data_criacao DESC
  `, [id_usuario, id_workspace]);
  
  return result.rows;
}

// Filtros para busca de tarefas em um workspace
export async function buscarTarefasComFiltros(id_workspace: number, filtros: any): Promise<Tarefa[]> {
  let query = `
    SELECT 
      t.*,
      tw.id_workspace,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias
    FROM tarefas t
    INNER JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
  `;
  
  const params: any[] = [id_workspace];
  let joins = '';
  let wheres = ['tw.id_workspace = $1'];

  if (filtros.categoria_nome) {
    joins += ' JOIN categorias c ON tc.id_categoria = c.id_categoria';
    wheres.push(`c.nome ILIKE $${params.length + 1}`);
    params.push(`%${filtros.categoria_nome}%`);
  }
  
  if (filtros.titulo) {
    wheres.push(`t.titulo ILIKE $${params.length + 1}`);
    params.push(`%${filtros.titulo}%`);
  }
  
  if (filtros.id_usuario) {
    wheres.push(`t.id_usuario = $${params.length + 1}`);
    params.push(filtros.id_usuario);
  }
  
  if (filtros.data_inicio) {
    wheres.push(`t.data_criacao >= $${params.length + 1}`);
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

  query += joins + ' WHERE ' + wheres.join(' AND ') + ' GROUP BY t.id_tarefa, tw.id_workspace ORDER BY t.data_criacao DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
}

export async function buscarTarefaPorTituloEUsuario(titulo: string, id_usuario: number): Promise<Tarefa | null> {
  const result = await pool.query(`
    SELECT 
      t.*,
      tw.id_workspace,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias
    FROM tarefas t
    LEFT JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    WHERE t.titulo = $1 AND t.id_usuario = $2
    GROUP BY t.id_tarefa, tw.id_workspace
  `, [titulo, id_usuario]);
  
  return result.rows[0] || null;
}

// Função para buscar apenas o ID de uma tarefa pelo título e usuário
export async function buscarIdTarefaPorTituloEUsuario(titulo: string, id_usuario: number): Promise<number | null> {
  const result = await pool.query('SELECT id_tarefa FROM tarefas WHERE titulo = $1 AND id_usuario = $2', [titulo, id_usuario]);
  return result.rows[0]?.id_tarefa || null;
}

// Função para buscar tarefa por ID e workspace
export async function buscarTarefaPorIdEWorkspace(id_tarefa: number, id_workspace: number): Promise<Tarefa | null> {
  const result = await pool.query(`
    SELECT 
      t.*,
      tw.id_workspace,
      COALESCE(
        ARRAY_AGG(DISTINCT tc.id_categoria) FILTER (WHERE tc.id_categoria IS NOT NULL), 
        ARRAY[]::INTEGER[]
      ) as categorias
    FROM tarefas t
    INNER JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    LEFT JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa
    WHERE t.id_tarefa = $1 AND tw.id_workspace = $2
    GROUP BY t.id_tarefa, tw.id_workspace
  `, [id_tarefa, id_workspace]);
  
  return result.rows[0] || null;
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
}

// Função para deletar tarefa (verifica se o usuário logado é o criador da tarefa)
export async function deletarTarefaPorId(id_tarefa: number, id_usuario_logado: number): Promise<boolean> {
  // Verifica se o usuário é o criador da tarefa
  const result = await pool.query(
    'SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1 AND id_usuario = $2',
    [id_tarefa, id_usuario_logado]
  );

  if (result.rows.length === 0) {
    return false; // Usuário não tem permissão
  }

  // Remove associações primeiro (categorias e workspaces)
  await removerCategoriaDaTarefa(id_tarefa);
  await removerTarefaDeWorkspace(id_tarefa);
  
  // Remove comentários da tarefa
  await pool.query('DELETE FROM comentarios WHERE id_tarefa = $1', [id_tarefa]);
  
  // Remove a tarefa
  await pool.query('DELETE FROM tarefas WHERE id_tarefa = $1', [id_tarefa]);
  return true;
}

// Função para buscar workspaces de uma tarefa
export async function buscarWorkspacesDaTarefa(id_tarefa: number): Promise<number[]> {
  const result = await pool.query(
    'SELECT id_workspace FROM tarefa_workspace WHERE id_tarefa = $1',
    [id_tarefa]
  );
  
  return result.rows.map(row => row.id_workspace);
}

// Função para verificar se usuário tem acesso à tarefa no workspace
export async function usuarioTemAcessoTarefa(id_tarefa: number, id_usuario: number, id_workspace: number, email: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT 1 
    FROM tarefas t
    INNER JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
    INNER JOIN usuario_workspace uw ON tw.id_workspace = uw.id_workspace
    WHERE t.id_tarefa = $1 AND uw.email = $2 AND tw.id_workspace = $3
    LIMIT 1
  `, [id_tarefa, email, id_workspace]);
  
  return result.rows.length > 0;
}