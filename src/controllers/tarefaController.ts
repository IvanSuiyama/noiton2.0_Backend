import { Request, Response } from 'express';
import * as tarefaService from '../services/tarefaService';
import pool from '../config/databaseConfig';

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

// Função principal de criação
export async function criarTarefa(req: Request, res: Response) {
  try {
    const tarefaData = req.body;
    
    if (!tarefaData.id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    // Adiciona o id_usuario do token (criador da tarefa)
    tarefaData.id_usuario = req.user?.id_usuario;
    
    await tarefaService.criarTarefa(tarefaData);
    enviarRespostaSucesso(res, 'Tarefa criada com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar tarefa', error);
  }
}

// Função para listar tarefas por workspace
export async function listarTarefasPorWorkspace(req: Request, res: Response) {
  try {
    const { id_workspace } = req.params;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    const tarefas = await tarefaService.buscarTarefasPorWorkspace(Number(id_workspace));
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas', error);
  }
}

// Função para buscar tarefas por responsável em um workspace
export async function buscarTarefasPorResponsavel(req: Request, res: Response) {
  try {
    const { email, id_workspace } = req.params;
    
    if (!email || !id_workspace) {
      return res.status(400).json({ error: 'Email e ID do workspace são obrigatórios.' });
    }
    
    const tarefas = await tarefaService.buscarTarefasPorResponsavelEWorkspace(email, Number(id_workspace));
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas por responsável', error);
  }
}

// Função para buscar tarefas com filtros
export async function buscarTarefasComFiltros(req: Request, res: Response) {
  try {
    const { id_workspace } = req.params;
    const filtros = req.query;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    const tarefas = await tarefaService.buscarTarefasComFiltros(Number(id_workspace), filtros);
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas', error);
  }
}

// Função para buscar tarefa por título e workspace
export async function buscarTarefaPorTituloEWorkspace(req: Request, res: Response) {
  try {
    const { titulo, id_workspace } = req.params;
    
    if (!titulo || !id_workspace) {
      return res.status(400).json({ error: 'Título e ID do workspace são obrigatórios.' });
    }
    
    const tarefa = await tarefaService.buscarTarefaPorTituloEWorkspace(titulo, Number(id_workspace));
    if (!tarefa) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    enviarDadosJSON(res, tarefa);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefa', error);
  }
}

// Função para atualizar tarefa
export async function atualizarTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    const dados = req.body;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    await tarefaService.atualizarTarefa(Number(id_tarefa), dados);
    enviarRespostaSucesso(res, 'Tarefa atualizada com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar tarefa', error);
  }
}

// Função para deletar tarefa
export async function deletarTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    const emailUsuario = req.user?.email;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    const deletado = await tarefaService.deletarTarefaPorId(Number(id_tarefa), emailUsuario);
    if (deletado) {
      enviarRespostaSucesso(res, 'Tarefa deletada com sucesso!');
    } else {
      enviarErroNaoAutorizado(res, 'Você não tem permissão para deletar esta tarefa.');
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar tarefa', error);
  }
}

// Controller para remover uma categoria específica de uma tarefa
export const removerCategoriaEspecifica = async (req: Request, res: Response) => {
  try {
    const { id_tarefa, id_categoria } = req.params;
    const emailUsuario = req.user?.email;
    
    if (!id_tarefa || !id_categoria) {
      return res.status(400).json({ error: 'ID da tarefa e ID da categoria são obrigatórios.' });
    }
    
    // Por enquanto, apenas retorna sucesso
    res.json({ message: 'Categoria removida da tarefa com sucesso' });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao remover categoria da tarefa', error);
  }
}

// Controller para remover todas as categorias de uma tarefa
export const removerTodasCategorias = async (req: Request, res: Response) => {
  try {
    const { id_tarefa } = req.params;
    const emailUsuario = req.user?.email;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    // Por enquanto, apenas retorna sucesso
    res.json({ message: 'Todas as categorias removidas da tarefa com sucesso' });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao remover todas as categorias da tarefa', error);
  }
}

// Função para associar categorias à tarefa
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
    
    console.log(`Associando categorias ${categorias} à tarefa ${id_tarefa}`);
    await tarefaService.associarCategoriasATarefa(Number(id_tarefa), categorias);
    console.log('Associação realizada com sucesso');
    
    enviarRespostaSucesso(res, 'Categorias associadas com sucesso!');
  } catch (error) {
    console.error('Erro ao associar categorias:', error);
    enviarRespostaErro(res, 'Erro ao associar categorias', error);
  }
}

// Função para listar categorias de uma tarefa
export async function listarCategoriasDaTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    const categorias = await pool.query(`
      SELECT c.id_categoria, c.nome, c.cor 
      FROM categorias c
      INNER JOIN tarefa_categoria tc ON c.id_categoria = tc.id_categoria
      WHERE tc.id_tarefa = $1
    `, [id_tarefa]);
    
    enviarDadosJSON(res, categorias.rows);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar categorias da tarefa', error);
  }
}

// Função para remover categorias da tarefa
export async function removerCategorias(req: Request, res: Response) {
  try {
    const { id_tarefa, id_categoria } = req.params;
    
    if (!id_tarefa) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    
    await tarefaService.removerCategoriaDaTarefa(Number(id_tarefa), id_categoria ? Number(id_categoria) : undefined);
    enviarRespostaSucesso(res, 'Categoria(s) removida(s) com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao remover categorias', error);
  }
}
