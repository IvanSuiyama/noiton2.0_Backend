import { Request, Response } from 'express';
import {
  cadastrarUsuario,
  editarUsuario,
  buscarTodosUsuarios,
  buscarUsuarioPorEmail,
  buscarUsuarioPorTelefone,
  deletarUsuarioPorEmail
} from '../services/usuarioService';

export async function cadastrar(req: Request, res: Response) {
  try {
    await cadastrarUsuario(req.body);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao cadastrar usuário', details: error });
  }
}

export async function editar(req: Request, res: Response) {
  try {
    await editarUsuario(req.params.email, req.body);
    res.json({ message: 'Usuário editado com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao editar usuário', details: error });
  }
}

export async function listarTodos(req: Request, res: Response) {
  try {
    const usuarios = await buscarTodosUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar usuários', details: error });
  }
}

export async function buscarPorEmail(req: Request, res: Response) {
  try {
    const usuario = await buscarUsuarioPorEmail(req.params.email);
    if (usuario) {
      res.json(usuario);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar usuário', details: error });
  }
}

export async function buscarPorTelefone(req: Request, res: Response) {
  try {
    const usuario = await buscarUsuarioPorTelefone(req.params.telefone);
    if (usuario) {
      res.json(usuario);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar usuário', details: error });
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    await deletarUsuarioPorEmail(req.params.email);
    res.json({ message: 'Usuário deletado com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar usuário', details: error });
  }
}
