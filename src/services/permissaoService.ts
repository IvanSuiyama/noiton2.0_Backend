import pool from '../config/databaseConfig';
import { TarefaPermissao } from '../models/tarefaPermissaoModel';

export interface PermissaoInfo {
  id_usuario: number;
  email: string;
  nome: string;
  nivel_acesso: 0 | 1 | 2;
}

// Função para obter descrição do nível de acesso
export function obterDescricaoNivel(nivel: 0 | 1 | 2): string {
  switch (nivel) {
    case 0:
      return 'Criador (pode ver, editar e apagar)';
    case 1:
      return 'Editor (pode ver e editar)';
    case 2:
      return 'Visualizador (pode apenas ver)';
    default:
      return 'Nível desconhecido';
  }
}

// Função para obter permissões detalhadas de um nível
export function obterPermissoesDetalhadas(nivel: 0 | 1 | 2 | null): { pode_ver: boolean, pode_editar: boolean, pode_apagar: boolean } {
  if (nivel === null) {
    return { pode_ver: false, pode_editar: false, pode_apagar: false };
  }
  
  return {
    pode_ver: true, // Todos os níveis podem ver
    pode_editar: nivel <= 1, // Níveis 0 e 1 podem editar
    pode_apagar: nivel === 0, // Apenas nível 0 pode apagar
  };
}

// Função para verificar o nível de acesso de um usuário em uma tarefa
export async function verificarPermissaoUsuario(idTarefa: number, idUsuario: number): Promise<number | null> {
  const result = await pool.query(
    `SELECT nivel_acesso FROM tarefa_permissoes 
     WHERE id_tarefa = $1 AND id_usuario = $2`,
    [idTarefa, idUsuario]
  );
  
  if (result.rows.length === 0) {
    // Verifica se o usuário é o criador da tarefa
    const criadorResult = await pool.query(
      `SELECT id_usuario FROM tarefas WHERE id_tarefa = $1 AND id_usuario = $2`,
      [idTarefa, idUsuario]
    );
    
    if (criadorResult.rows.length > 0) {
      return 0; // Criador tem nível 0
    }
    
    return null; // Usuário não tem permissão
  }
  
  return result.rows[0].nivel_acesso;
}

// Função para adicionar permissão a um usuário
export async function adicionarPermissao(permissao: Omit<TarefaPermissao, 'id_permissao' | 'data_criacao'>): Promise<void> {
  await pool.query(
    `INSERT INTO tarefa_permissoes (id_tarefa, id_usuario, nivel_acesso) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (id_tarefa, id_usuario) 
     DO UPDATE SET nivel_acesso = EXCLUDED.nivel_acesso`,
    [permissao.id_tarefa, permissao.id_usuario, permissao.nivel_acesso]
  );
}

// Função para listar todas as permissões de uma tarefa
export async function listarPermissoesTarefa(idTarefa: number): Promise<PermissaoInfo[]> {
  const result = await pool.query(
    `SELECT tp.id_usuario, u.email, u.nome, tp.nivel_acesso
     FROM tarefa_permissoes tp
     JOIN usuarios u ON tp.id_usuario = u.id_usuario
     WHERE tp.id_tarefa = $1
     ORDER BY tp.nivel_acesso ASC, u.nome ASC`,
    [idTarefa]
  );
  
  return result.rows;
}

// Função para remover permissão de um usuário
export async function removerPermissao(idTarefa: number, idUsuario: number): Promise<void> {
  await pool.query(
    `DELETE FROM tarefa_permissoes 
     WHERE id_tarefa = $1 AND id_usuario = $2`,
    [idTarefa, idUsuario]
  );
}

// Função para listar tarefas que o usuário tem acesso
export async function listarTarefasComPermissao(idUsuario: number): Promise<any[]> {
  const result = await pool.query(
    `SELECT DISTINCT t.*, 
            CASE 
              WHEN t.id_usuario = $1 THEN 0 
              ELSE COALESCE(tp.nivel_acesso, null)
            END as nivel_acesso,
            CASE 
              WHEN t.id_usuario = $1 THEN true
              ELSE (tp.nivel_acesso <= 1)
            END as pode_editar,
            CASE 
              WHEN t.id_usuario = $1 THEN true
              ELSE false
            END as pode_apagar
     FROM tarefas t
     LEFT JOIN tarefa_permissoes tp ON t.id_tarefa = tp.id_tarefa AND tp.id_usuario = $1
     WHERE t.id_usuario = $1 OR tp.id_usuario = $1
     ORDER BY t.data_criacao DESC`,
    [idUsuario]
  );
  
  return result.rows;
}

// Função para verificar se o usuário pode realizar uma ação específica
export async function podeRealizarAcao(idTarefa: number, idUsuario: number, acao: 'ver' | 'editar' | 'apagar'): Promise<boolean> {
  const nivelPermissao = await verificarPermissaoUsuario(idTarefa, idUsuario);
  
  // Se o usuário não tem permissão nenhuma, não pode fazer nada
  if (nivelPermissao === null) return false;
  
  switch (acao) {
    case 'ver':
      return true; // Se tem qualquer nível de permissão (0, 1 ou 2), pode ver
    case 'editar':
      return nivelPermissao <= 1; // Níveis 0 e 1 podem editar
    case 'apagar':
      return nivelPermissao === 0; // Apenas nível 0 (criador) pode apagar
    default:
      return false;
  }
}