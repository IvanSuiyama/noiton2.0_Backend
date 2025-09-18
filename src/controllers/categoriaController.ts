import { Request, Response } from 'express';
import {
  criarCategoria,
  buscarCategoriasPorNome,
  listarCategorias,
  deletarCategoria,
  atualizarCategoria
} from '../services/categoriaService';

export async function criar(req: Request, res: Response) {
  try {
    await criarCategoria(req.body.nome);
    res.status(201).json({ message: 'Categoria criada com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar categoria', details: error });
  }
}

export async function listar(req: Request, res: Response) {
  try {
    const categorias = await listarCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao listar categorias', details: error });
  }
}

export async function buscarPorNome(req: Request, res: Response) {
  try {
    const categorias = await buscarCategoriasPorNome(req.params.nome);
    res.json(categorias);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar categoria', details: error });
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    await atualizarCategoria(Number(req.params.id_categoria), req.body.nome);
    res.json({ message: 'Categoria atualizada com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar categoria', details: error });
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const deletado = await deletarCategoria(Number(req.params.id_categoria));
    if (deletado) {
      res.json({ message: 'Categoria deletada com sucesso!' });
    } else {
      res.status(403).json({ error: 'Categoria está atrelada a uma tarefa e não pode ser deletada.' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar categoria', details: error });
  }
}
