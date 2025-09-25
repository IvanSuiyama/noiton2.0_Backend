import { Request, Response } from 'express';
import {
  criarWorkspace,
  buscarWorkspacesPorEmail,
  buscarWorkspacePorNome,
  atualizarWorkspace,
  deletarWorkspaceSeCriador
} from '../services/workspaceService';

// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// Função auxiliar específica para workspace não autorizado
export function enviarErroWorkspaceNaoAutorizado(res: Response): void {
  res.status(403).json({ error: 'Somente o dono do workspace pode apagar.' });
}

// Função auxiliar para extrair dados do workspace
export function extrairDadosWorkspace(req: Request): any {
  return req.body;
}

// Função auxiliar para extrair email do usuário logado
export function extrairEmailUsuarioLogado(req: Request): string {
  return req.user?.email || '';
}

// Função principal de criação
export async function criar(req: Request, res: Response) {
  try {
    const workspace = extrairDadosWorkspace(req);
    const criador = extrairEmailUsuarioLogado(req);
    
    // Adiciona o criador ao workspace
    workspace.criador = criador;
    
    // Inclui o criador na lista de emails (se não estiver presente)
    workspace.emails = workspace.emails || [];
    if (!workspace.emails.includes(criador)) {
      workspace.emails.push(criador);
    }
    
    await criarWorkspace(workspace);
    enviarRespostaSucesso(res, 'Workspace criado com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar workspace', error);
  }
}

// Função principal de listagem por email
export async function listarPorEmail(req: Request, res: Response) {
  try {
    const workspaces = await buscarWorkspacesPorEmail(req.params.email);
    enviarDadosJSON(res, workspaces);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar workspaces', error);
  }
}

// Função principal de busca por nome
export async function buscarPorNome(req: Request, res: Response) {
  try {
    const workspace = await buscarWorkspacePorNome(req.params.nome);
    if (workspace) {
      enviarDadosJSON(res, workspace);
    } else {
      enviarErro404(res, 'Workspace não encontrado');
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar workspace', error);
  }
}

// Função principal de atualização
export async function atualizar(req: Request, res: Response) {
  try {
    const dados = extrairDadosWorkspace(req);
    await atualizarWorkspace(req.params.nome, dados);
    enviarRespostaSucesso(res, 'Workspace atualizado com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar workspace', error);
  }
}

// Função principal de deleção
export async function deletar(req: Request, res: Response) {
  try {
    const email = extrairEmailUsuarioLogado(req);
    const deletado = await deletarWorkspaceSeCriador(req.params.nome, email);
    if (deletado) {
      enviarRespostaSucesso(res, 'Workspace deletado com sucesso!');
    } else {
      enviarErroWorkspaceNaoAutorizado(res);
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar workspace', error);
  }
}
