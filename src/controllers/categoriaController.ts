import { Request, Response } from 'express';
import {
  criarCategoria,
  buscarCategoriasPorNome,
  listarCategorias,
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
    await criarCategoria(req.body.nome);
    enviarRespostaSucesso(res, 'Categoria criada com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar categoria', error);
  }
}

// Função principal de listagem
export async function listar(req: Request, res: Response) {
  try {
    const categorias = await listarCategorias();
    enviarDadosJSON(res, categorias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar categorias', error);
  }
}

// Função principal de busca por nome
export async function buscarPorNome(req: Request, res: Response) {
  try {
    const categorias = await buscarCategoriasPorNome(req.params.nome);
    enviarDadosJSON(res, categorias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar categoria', error);
  }
}

// Função principal de atualização
export async function atualizar(req: Request, res: Response) {
  try {
    await atualizarCategoria(Number(req.params.id_categoria), req.body.nome);
    enviarRespostaSucesso(res, 'Categoria atualizada com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar categoria', error);
  }
}

// Função principal de deleção
export async function deletar(req: Request, res: Response) {
  try {
    const deletado = await deletarCategoria(Number(req.params.id_categoria));
    if (deletado) {
      enviarRespostaSucesso(res, 'Categoria deletada com sucesso!');
    } else {
      enviarErroCategoriaEmUso(res);
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar categoria', error);
  }
}
