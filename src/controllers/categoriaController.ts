import { Request, Response } from 'express';
import {
  criarCategoria,
  buscarCategoriasPorNomeEWorkspace,
  listarCategoriasPorWorkspace,
  deletarCategoria,
  atualizarCategoria
} from '../services/categoriaService';

// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON
} from './usuarioController';

// Função auxiliar específica para categoria não deletável
export function enviarErroCategoriaEmUso(res: Response): void {
  res.status(403).json({ error: 'Categoria está atrelada a uma tarefa e não pode ser deletada.' });
}

// Função principal de criação
export async function criar(req: Request, res: Response) {
  try {
    const { nome, cor = '#007acc', id_workspace } = req.body;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    await criarCategoria(nome, cor, Number(id_workspace));
    enviarRespostaSucesso(res, 'Categoria criada com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar categoria', error);
  }
}

// Função principal de listagem por workspace
export async function listarPorWorkspace(req: Request, res: Response) {
  try {
    const id_workspace = req.params.id_workspace || req.query.id_workspace;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    const categorias = await listarCategoriasPorWorkspace(Number(id_workspace));
    enviarDadosJSON(res, categorias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar categorias', error);
  }
}

// Função principal de busca por nome em um workspace
export async function buscarPorNomeEWorkspace(req: Request, res: Response) {
  try {
    const { nome } = req.params;
    const id_workspace = req.params.id_workspace || req.query.id_workspace;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    const categorias = await buscarCategoriasPorNomeEWorkspace(nome, Number(id_workspace));
    enviarDadosJSON(res, categorias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar categoria', error);
  }
}

// Função para buscar por nome (compatibilidade com versão anterior)
export async function buscarPorNome(req: Request, res: Response) {
  try {
    const { nome } = req.params;
    const id_workspace = req.query.id_workspace;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório como query parameter.' });
    }
    
    const categorias = await buscarCategoriasPorNomeEWorkspace(nome, Number(id_workspace));
    enviarDadosJSON(res, categorias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar categoria por nome', error);
  }
}

// Função principal de atualização
export async function atualizar(req: Request, res: Response) {
  try {
    const { id_categoria } = req.params;
    const { nome, cor, id_workspace } = req.body;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    await atualizarCategoria(Number(id_categoria), nome, cor, Number(id_workspace));
    enviarRespostaSucesso(res, 'Categoria atualizada com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar categoria', error);
  }
}

// Função principal de deleção
export async function deletar(req: Request, res: Response) {
  try {
    const { id_categoria } = req.params;
    const { id_workspace } = req.body;
    
    if (!id_workspace) {
      return res.status(400).json({ error: 'ID do workspace é obrigatório.' });
    }
    
    const deletado = await deletarCategoria(Number(id_categoria), Number(id_workspace));
    if (deletado) {
      enviarRespostaSucesso(res, 'Categoria deletada com sucesso!');
    } else {
      enviarErroCategoriaEmUso(res);
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar categoria', error);
  }
}
