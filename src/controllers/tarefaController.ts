import { Request, Response } from 'express';
import * as tarefaService from '../services/tarefaService';
import pool from '../config/databaseConfig';
import { Tarefa } from '../services/tarefaService';
import { adicionarPontosUsuario } from '../services/usuarioService';
// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// Função auxiliar específica para tarefa não autorizada
export function enviarErroNaoAutorizado(res: Response, message: string): void {
  res.status(403).json({ error: message });
}

// Função principal de criação - CORRIGIDA
export async function criarTarefa(req: Request, res: Response) {
  try {
    console.log('🔍 DEBUG - req.user completo:', req.user);
    console.log('🔍 DEBUG - req.user.id_usuario:', req.user?.id_usuario);
    
    const { id_workspace, ...tarefaData } = req.body;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    if (!tarefaData.titulo) {
      return res.status(400).json({ error: 'Título da tarefa é obrigatório.' });
    }
    
    // VERIFICAÇÃO CRÍTICA: Garantir que o id_usuario está disponível
    if (!req.user?.id_usuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    
    // Cria objeto Tarefa corretamente tipado (SEM id_usuario)
    const tarefa: Tarefa = {
      titulo: tarefaData.titulo,
      descricao: tarefaData.descricao,
      data_fim: tarefaData.data_fim ? new Date(tarefaData.data_fim) : undefined,
      prioridade: tarefaData.prioridade || 'media',
      status: tarefaData.status || 'a_fazer',
      concluida: tarefaData.concluida ?? false,
      recorrente: tarefaData.recorrente ?? false,
      recorrencia: tarefaData.recorrencia,
      categorias: tarefaData.categorias
      // ❌ REMOVER: id_usuario (não faz mais parte da interface)
    };
    
    console.log('Dados da tarefa:', tarefa);
    console.log('Workspace ID:', id_workspace);
    console.log('ID Usuário do token:', req.user.id_usuario);
    
    // ✅ CORREÇÃO: Passar id_usuario como terceiro parâmetro
    const id_tarefa = await tarefaService.criarTarefa(
      tarefa, 
      Number(id_workspace),
      req.user.id_usuario  // ← TERCEIRO PARÂMETRO
    );
    
    enviarRespostaSucesso(res, 'Tarefa criada com sucesso!', 201);
  } catch (error) {
    console.error('Erro detalhado ao criar tarefa:', error);
    enviarRespostaErro(res, 'Erro ao criar tarefa', error);
  }
}

export async function listarTarefasPorWorkspace(req: Request, res: Response) {
  try {
    const { id_workspace } = req.params;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    // ✅ CORREÇÃO: Usar usuario_workspace em vez de workspace_membros
    const temAcesso = await pool.query(
      'SELECT 1 FROM usuario_workspace WHERE id_workspace = $1 AND email = $2',
      [Number(id_workspace), req.user?.email]  // ✅ Usar email em vez de id_usuario
    );
    
    if (temAcesso.rows.length === 0) {
      return enviarErroNaoAutorizado(res, 'Você não tem acesso a este workspace');
    }
    
    const tarefas = await tarefaService.buscarTarefasPorWorkspace(Number(id_workspace));
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas', error);
  }
}

// Função para buscar tarefas por usuário em um workspace
export async function buscarTarefasPorUsuarioEWorkspace(req: Request, res: Response) {
  try {
    const { id_workspace } = req.params;
    const { id_usuario } = req.query;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    const usuarioId = id_usuario ? Number(id_usuario) : req.user?.id_usuario;
    
    if (!usuarioId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }
    
    const tarefas = await tarefaService.buscarTarefasPorUsuarioEWorkspace(
      usuarioId, 
      Number(id_workspace)
    );
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas por usuário', error);
  }
}

// Função para buscar tarefas com filtros (mantém compatibilidade)
export async function buscarTarefasComFiltros(req: Request, res: Response) {
  try {
    const { id_workspace } = req.params;
    const filtros = req.query;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    // Verifica se o usuário tem acesso ao workspace
    const temAcesso = await pool.query(
      'SELECT 1 FROM usuario_workspace WHERE id_workspace = $1 AND email = $2',
      [Number(id_workspace), req.user?.email]
    );
    
    if (temAcesso.rows.length === 0) {
      return enviarErroNaoAutorizado(res, 'Você não tem acesso a este workspace');
    }
    
    const tarefas = await tarefaService.buscarTarefasComFiltros(Number(id_workspace), filtros);
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas', error);
  }
}

// ✨ NOVA FUNÇÃO: Buscar tarefas com filtros avançados
export async function buscarTarefasComFiltrosAvancados(req: Request, res: Response) {
  try {
    const { id_workspace } = req.params;
    const filtros = req.query as tarefaService.FiltrosAvancados;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    // Verifica se o usuário tem acesso ao workspace
    const temAcesso = await pool.query(
      'SELECT 1 FROM usuario_workspace WHERE id_workspace = $1 AND email = $2',
      [Number(id_workspace), req.user?.email]
    );
    
    if (temAcesso.rows.length === 0) {
      return enviarErroNaoAutorizado(res, 'Você não tem acesso a este workspace');
    }
    
    console.log('🔍 Filtros recebidos:', filtros);
    console.log('🔍 Usuário logado:', req.user?.id_usuario);
    
    const tarefas = await tarefaService.buscarTarefasComFiltrosAvancados(
      Number(id_workspace), 
      filtros,
      req.user?.id_usuario
    );
    
    console.log('✅ Tarefas encontradas:', tarefas.length);
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas com filtros avançados:', error);
    enviarRespostaErro(res, 'Erro ao buscar tarefas com filtros avançados', error);
  }
}

// Função para buscar tarefa por título e usuário
export async function buscarTarefaPorTituloEUsuario(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    
    if (!titulo) {
      return res.status(400).json({ error: 'Título da tarefa é obrigatório.' });
    }
    
    const tarefa = await tarefaService.buscarTarefaPorTituloEUsuario(titulo, req.user?.id_usuario);
    if (!tarefa) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    enviarDadosJSON(res, tarefa);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefa', error);
  }
}

// Função para buscar tarefa por ID e workspace (COM VERIFICAÇÃO DE ACESSO)
export async function buscarTarefaPorIdEWorkspace(req: Request, res: Response) {
  try {
    const { id_tarefa, id_workspace } = req.params;
    
    if (!id_tarefa || !id_workspace) {
      return res.status(400).json({ error: 'ID da tarefa e ID do workspace são obrigatórios.' });
    }
    
    // Verifica se o usuário tem acesso à tarefa no workspace
    const temAcesso = await tarefaService.usuarioTemAcessoTarefa(
      Number(id_tarefa), 
      req.user?.id_usuario, 
      Number(id_workspace),
      req.user?.email
    );
    
    if (!temAcesso) {
      return enviarErroNaoAutorizado(res, 'Você não tem acesso a esta tarefa');
    }
    
    const tarefa = await tarefaService.buscarTarefaPorIdEWorkspace(
      Number(id_tarefa), 
      Number(id_workspace)
    );
    
    if (!tarefa) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    enviarDadosJSON(res, tarefa);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefa', error);
  }
}

// Função para atualizar tarefa (SEM VERIFICAÇÃO DE PERMISSÃO - apenas verifica se existe)
export async function atualizarTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    const dados = req.body;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    // Busca dados completos da tarefa antes da atualização
    const tarefaAntes = await pool.query(
      'SELECT id_tarefa, status, data_fim, id_usuario FROM tarefas WHERE id_tarefa = $1',
      [Number(id_tarefa)]
    );
    
    if (tarefaAntes.rows.length === 0) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    const tarefaAtual = tarefaAntes.rows[0];
    
    // Atualiza a tarefa
    await tarefaService.atualizarTarefa(Number(id_tarefa), dados);
    
    // Verifica se a tarefa foi concluída
    if (dados.status === 'concluido' && tarefaAtual.status !== 'concluido') {
      const agora = new Date();
      const dataFim = tarefaAtual.data_fim ? new Date(tarefaAtual.data_fim) : null;
      
      // Usuário sempre ganha 0.5 pontos ao completar uma tarefa
      let pontosGanhos = 0.5;
      let motivoPontos = 'completar tarefa';
      
      // Se há data limite e foi concluída dentro do prazo, ganha pontos extras
      if (dataFim && agora <= dataFim) {
        pontosGanhos = 1.0; // 0.5 por completar + 0.5 bônus por estar no prazo
        motivoPontos = 'completar tarefa dentro do prazo';
      }
      
      await adicionarPontosUsuario(tarefaAtual.id_usuario, pontosGanhos);
      console.log(`✅ Usuário ${tarefaAtual.id_usuario} ganhou ${pontosGanhos} pontos por ${motivoPontos} (tarefa ${id_tarefa})`);
    }
    
    enviarRespostaSucesso(res, 'Tarefa atualizada com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar tarefa', error);
  }
}

// Função para deletar tarefa (SOMENTE O CRIADOR PODE DELETAR)
export async function deletarTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    const deletado = await tarefaService.deletarTarefaPorId(
      Number(id_tarefa), 
      req.user?.id_usuario
    );
    
    if (deletado) {
      enviarRespostaSucesso(res, 'Tarefa deletada com sucesso!');
    } else {
      enviarErroNaoAutorizado(res, 'Você não tem permissão para deletar esta tarefa. Apenas o criador pode deletar.');
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar tarefa', error);
  }
}

// Função para associar categorias à tarefa (SEM VERIFICAÇÃO DE PERMISSÃO)
export async function associarCategorias(req: Request, res: Response) {
  try {
    console.log('=== ASSOCIAR CATEGORIAS ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    
    const { id_tarefa } = req.params;
    const { categorias } = req.body;
    
    if (!id_tarefa) {
      console.log('Erro: ID da tarefa não fornecido');
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    if (!categorias || !Array.isArray(categorias)) {
      console.log('Erro: Categorias não fornecidas ou formato incorreto');
      return res.status(400).json({ error: 'Lista de categorias é obrigatória.' });
    }
    
    // Apenas verifica se a tarefa existe
    const tarefaExiste = await pool.query(
      'SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1',
      [Number(id_tarefa)]
    );
    
    if (tarefaExiste.rows.length === 0) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    console.log(`Associando categorias ${categorias} à tarefa ${id_tarefa}`);
    await tarefaService.associarCategoriasATarefa(Number(id_tarefa), categorias);
    console.log('Associação realizada com sucesso');
    
    enviarRespostaSucesso(res, 'Categorias associadas com sucesso!');
  } catch (error) {
    console.error('Erro ao associar categorias:', error);
    enviarRespostaErro(res, 'Erro ao associar categorias', error);
  }
}

// Função para listar categorias de uma tarefa (COM VERIFICAÇÃO DE ACESSO)
export async function listarCategoriasDaTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    // Verifica se o usuário tem acesso à tarefa
    const tarefa = await pool.query(
      `SELECT t.id_tarefa 
       FROM tarefas t
       LEFT JOIN tarefa_workspace tw ON t.id_tarefa = tw.id_tarefa
       LEFT JOIN usuario_workspace uw ON tw.id_workspace = uw.id_workspace
       WHERE t.id_tarefa = $1 AND uw.email = $2`,
      [Number(id_tarefa), req.user?.email]
    );
    
    if (tarefa.rows.length === 0) {
      return enviarErroNaoAutorizado(res, 'Você não tem acesso a esta tarefa');
    }
    
    const categorias = await pool.query(`
      SELECT c.id_categoria, c.nome
      FROM categorias c
      INNER JOIN tarefa_categoria tc ON c.id_categoria = tc.id_categoria
      WHERE tc.id_tarefa = $1
    `, [id_tarefa]);
    
    enviarDadosJSON(res, categorias.rows);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar categorias da tarefa', error);
  }
}

// Função para remover categorias da tarefa (SEM VERIFICAÇÃO DE PERMISSÃO)
export async function removerCategorias(req: Request, res: Response) {
  try {
    const { id_tarefa, id_categoria } = req.params;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    // Apenas verifica se a tarefa existe
    const tarefaExiste = await pool.query(
      'SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1',
      [Number(id_tarefa)]
    );
    
    if (tarefaExiste.rows.length === 0) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    await tarefaService.removerCategoriaDaTarefa(
      Number(id_tarefa), 
      id_categoria ? Number(id_categoria) : undefined
    );
    
    enviarRespostaSucesso(res, 'Categoria(s) removida(s) com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao remover categorias', error);
  }
}

// Função para associar tarefa a outro workspace (SEM VERIFICAÇÃO DE PERMISSÃO)
export async function associarTarefaAWorkspace(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    const { id_workspace } = req.body;
    
    if (!id_tarefa || !id_workspace) {
      return res.status(400).json({ error: 'ID da tarefa e ID do workspace são obrigatórios.' });
    }
    
    // Apenas verifica se a tarefa existe
    const tarefaExiste = await pool.query(
      'SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1',
      [Number(id_tarefa)]
    );
    
    if (tarefaExiste.rows.length === 0) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    await tarefaService.associarTarefaAWorkspace(Number(id_tarefa), Number(id_workspace));
    enviarRespostaSucesso(res, 'Tarefa associada ao workspace com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao associar tarefa ao workspace', error);
  }
}

// Função para remover tarefa de um workspace (SEM VERIFICAÇÃO DE PERMISSÃO)
export async function removerTarefaDeWorkspace(req: Request, res: Response) {
  try {
    const { id_tarefa, id_workspace } = req.params;
    
    if (!id_tarefa || !id_workspace) {
      return res.status(400).json({ error: 'ID da tarefa e ID do workspace são obrigatórios.' });
    }
    
    // Apenas verifica se a tarefa existe
    const tarefaExiste = await pool.query(
      'SELECT id_tarefa FROM tarefas WHERE id_tarefa = $1',
      [Number(id_tarefa)]
    );
    
    if (tarefaExiste.rows.length === 0) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    await tarefaService.removerTarefaDeWorkspace(Number(id_tarefa), Number(id_workspace));
    enviarRespostaSucesso(res, 'Tarefa removida do workspace com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao remover tarefa do workspace', error);
  }
}