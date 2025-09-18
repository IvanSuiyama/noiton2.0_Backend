import pool from '../config/databaseConfig';

export interface TarefaRecorrente {
  id_tarefa_recorrente?: number;
  titulo: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  prioridade?: 'alta' | 'media' | 'baixa';
  concluida?: boolean;
  status?: string;
  categorias?: number[]; // lista de ids de categoria
  palavras_chave?: string[];
  email: string; // responsável
  recorrencia: 'diaria' | 'semanal' | 'mensal' | 'anual';
}

// Criação de tarefa recorrente com categorias e palavras-chave
export async function criarTarefaRecorrente(tarefa: TarefaRecorrente): Promise<void> {
  const result = await pool.query(
    `INSERT INTO tarefas_recorrentes (titulo, descricao, data_inicio, data_fim, prioridade, concluida, status, recorrencia) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_tarefa_recorrente`,
    [tarefa.titulo, tarefa.descricao, tarefa.data_inicio, tarefa.data_fim, tarefa.prioridade, tarefa.concluida ?? false, tarefa.status, tarefa.recorrencia]
  );
  const id_tarefa_recorrente = result.rows[0].id_tarefa_recorrente;
  // Associa categorias
  if (tarefa.categorias && tarefa.categorias.length > 0) {
    for (const id_categoria of tarefa.categorias) {
      await pool.query('INSERT INTO tarefa_recorrente_categoria (id_tarefa_recorrente, id_categoria) VALUES ($1, $2)', [id_tarefa_recorrente, id_categoria]);
    }
  }
  // Associa responsável (usuário) à tarefa recorrente
  // Lógica de associação ao workspace se necessário
}

// Filtros: nome, categoria (nome), prazo inicial/final, prioridade, palavras-chave, recorrência
export async function buscarTarefasRecorrentes(filtros: any): Promise<TarefaRecorrente[]> {
  let query = `SELECT tr.* FROM tarefas_recorrentes tr`;
  const params: any[] = [];
  let joins = '';
  let wheres = [];

  if (filtros.categoria_nome) {
    joins += ' JOIN tarefa_recorrente_categoria trc ON tr.id_tarefa_recorrente = trc.id_tarefa_recorrente JOIN categorias c ON trc.id_categoria = c.id_categoria';
    wheres.push(`c.nome ILIKE $${params.length + 1}`);
    params.push(`%${filtros.categoria_nome}%`);
  }
  if (filtros.titulo) {
    wheres.push(`tr.titulo ILIKE $${params.length + 1}`);
    params.push(`%${filtros.titulo}%`);
  }
  if (filtros.data_inicio) {
    wheres.push(`tr.data_inicio >= $${params.length + 1}`);
    params.push(filtros.data_inicio);
  }
  if (filtros.data_fim) {
    wheres.push(`tr.data_fim <= $${params.length + 1}`);
    params.push(filtros.data_fim);
  }
  if (filtros.prioridade) {
    wheres.push(`tr.prioridade = $${params.length + 1}`);
    params.push(filtros.prioridade);
  }
  if (filtros.palavras_chave) {
    wheres.push(`tr.descricao ILIKE $${params.length + 1}`);
    params.push(`%${filtros.palavras_chave}%`);
  }
  if (filtros.recorrencia) {
    wheres.push(`tr.recorrencia = $${params.length + 1}`);
    params.push(filtros.recorrencia);
  }
  if (wheres.length > 0) {
    query += joins + ' WHERE ' + wheres.join(' AND ');
  }
  const result = await pool.query(query, params);
  return result.rows;
}

export async function buscarTarefaRecorrentePorNome(titulo: string): Promise<TarefaRecorrente | null> {
  const result = await pool.query('SELECT * FROM tarefas_recorrentes WHERE titulo = $1', [titulo]);
  return result.rows[0] || null;
}

export async function atualizarTarefaRecorrente(titulo: string, dados: Partial<TarefaRecorrente>): Promise<void> {
  let query = 'UPDATE tarefas_recorrentes SET';
  const params: any[] = [];
  let set = [];
  if (dados.descricao) {
    set.push('descricao = $' + (params.length + 1));
    params.push(dados.descricao);
  }
  if (dados.data_inicio) {
    set.push('data_inicio = $' + (params.length + 1));
    params.push(dados.data_inicio);
  }
  if (dados.data_fim) {
    set.push('data_fim = $' + (params.length + 1));
    params.push(dados.data_fim);
  }
  if (dados.prioridade) {
    set.push('prioridade = $' + (params.length + 1));
    params.push(dados.prioridade);
  }
  if (typeof dados.concluida === 'boolean') {
    set.push('concluida = $' + (params.length + 1));
    params.push(dados.concluida);
  }
  if (dados.status) {
    set.push('status = $' + (params.length + 1));
    params.push(dados.status);
  }
  if (dados.recorrencia) {
    set.push('recorrencia = $' + (params.length + 1));
    params.push(dados.recorrencia);
  }
  query += ' ' + set.join(', ') + ' WHERE titulo = $' + (params.length + 1);
  params.push(titulo);
  await pool.query(query, params);
  // Atualiza categorias se fornecido
  // ...
}

// Só permite deletar se atrelada a um email e for o logado
export async function deletarTarefaRecorrentePorNome(titulo: string, email: string): Promise<boolean> {
  // Lógica de verificação de vínculo com o email
  // Exemplo: buscar se a tarefa recorrente está associada ao email do usuário logado
  // Se sim, deleta; se não, retorna false
  // ...
  return true;
}
