import pool from '../config/databaseConfig';

export interface Tarefa {
  id_tarefa?: number;
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
}

// Criação de tarefa com categorias e palavras-chave
export async function criarTarefa(tarefa: Tarefa): Promise<void> {
  const result = await pool.query(
    `INSERT INTO tarefas (titulo, descricao, data_inicio, data_fim, prioridade, concluida, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_tarefa`,
    [tarefa.titulo, tarefa.descricao, tarefa.data_inicio, tarefa.data_fim, tarefa.prioridade, tarefa.concluida ?? false, tarefa.status]
  );
  const id_tarefa = result.rows[0].id_tarefa;
  // Associa categorias
  if (tarefa.categorias && tarefa.categorias.length > 0) {
    for (const id_categoria of tarefa.categorias) {
      await pool.query('INSERT INTO tarefa_categoria (id_tarefa, id_categoria) VALUES ($1, $2)', [id_tarefa, id_categoria]);
    }
  }
  // Associa responsável (usuário) à tarefa (via workspace)
  // Aqui você pode criar a lógica de associação ao workspace se necessário
}

// Filtros: nome, categoria (nome), prazo inicial/final, prioridade, palavras-chave
export async function buscarTarefas(filtros: any): Promise<Tarefa[]> {
  let query = `SELECT t.* FROM tarefas t`;
  const params: any[] = [];
  let joins = '';
  let wheres = [];

  if (filtros.categoria_nome) {
    joins += ' JOIN tarefa_categoria tc ON t.id_tarefa = tc.id_tarefa JOIN categorias c ON tc.id_categoria = c.id_categoria';
    wheres.push(`c.nome ILIKE $${params.length + 1}`);
    params.push(`%${filtros.categoria_nome}%`);
  }
  if (filtros.titulo) {
    wheres.push(`t.titulo ILIKE $${params.length + 1}`);
    params.push(`%${filtros.titulo}%`);
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
  if (filtros.palavras_chave) {
    wheres.push(`t.descricao ILIKE $${params.length + 1}`);
    params.push(`%${filtros.palavras_chave}%`);
  }
  if (wheres.length > 0) {
    query += joins + ' WHERE ' + wheres.join(' AND ');
  }
  const result = await pool.query(query, params);
  return result.rows;
}

export async function buscarTarefaPorNome(titulo: string): Promise<Tarefa | null> {
  const result = await pool.query('SELECT * FROM tarefas WHERE titulo = $1', [titulo]);
  return result.rows[0] || null;
}

export async function atualizarTarefa(titulo: string, dados: Partial<Tarefa>): Promise<void> {
  let query = 'UPDATE tarefas SET';
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
  query += ' ' + set.join(', ') + ' WHERE titulo = $' + (params.length + 1);
  params.push(titulo);
  await pool.query(query, params);
  // Atualiza categorias se fornecido
  // ...
}

// Só permite deletar se atrelada a um email e for o logado
export async function deletarTarefaPorNome(titulo: string, email: string): Promise<boolean> {
  // Aqui você pode implementar a lógica de verificação de vínculo com o email
  // Exemplo: buscar se a tarefa está associada ao email do usuário logado
  // Se sim, deleta; se não, retorna false
  // ...
  return true;
}
