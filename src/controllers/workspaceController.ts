import { Request, Response } from 'express';
import {
  criarWorkspace,
  buscarWorkspacesPorEmail,
  buscarWorkspacePorNome,
  atualizarWorkspace,
  deletarWorkspaceSePessoal
} from '../services/workspaceService';

export async function criar(req: Request, res: Response) {
  try {
    await criarWorkspace(req.body);
    res.status(201).json({ message: 'Workspace criado com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar workspace', details: error });
  }
}

export async function listarPorEmail(req: Request, res: Response) {
  try {
    const workspaces = await buscarWorkspacesPorEmail(req.params.email);
    res.json(workspaces);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar workspaces', details: error });
  }
}

export async function buscarPorNome(req: Request, res: Response) {
  try {
    const workspace = await buscarWorkspacePorNome(req.params.nome);
    if (workspace) {
      res.json(workspace);
    } else {
      res.status(404).json({ error: 'Workspace não encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar workspace', details: error });
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    await atualizarWorkspace(req.params.nome, req.body);
    res.json({ message: 'Workspace atualizado com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar workspace', details: error });
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const deletado = await deletarWorkspaceSePessoal(req.params.nome);
    if (deletado) {
      res.json({ message: 'Workspace deletado com sucesso!' });
    } else {
      res.status(403).json({ error: 'Só é possível deletar workspaces pessoais.' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar workspace', details: error });
  }
}
