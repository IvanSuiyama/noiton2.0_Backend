import { Request, Response } from 'express';
import {
  cadastrarUsuario,
  editarUsuario,
  buscarTodosUsuarios,
  buscarUsuarioPorEmail,
  buscarUsuarioPorTelefone,
  deletarUsuarioPorEmail,
  removerPontosUsuario
} from '../services/usuarioService';

// Função auxiliar para enviar resposta de sucesso
export function enviarRespostaSucesso(res: Response, message: string, statusCode: number = 200): void {
  res.status(statusCode).json({ message });
}

// Função auxiliar para enviar resposta de erro
export function enviarRespostaErro(res: Response, error: string, details: any, statusCode: number = 400): void {
  res.status(statusCode).json({ error, details });
}

// Função auxiliar para enviar dados JSON
export function enviarDadosJSON(res: Response, dados: any): void {
  res.json(dados);
}

// Função auxiliar para enviar erro 404
export function enviarErro404(res: Response, message: string): void {
  res.status(404).json({ error: message });
}

// Função principal de cadastro
export async function cadastrar(req: Request, res: Response) {
  try {
    await cadastrarUsuario(req.body);
    enviarRespostaSucesso(res, 'Usuário cadastrado com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao cadastrar usuário', error);
  }
}

// Função principal de edição
export async function editar(req: Request, res: Response) {
  try {
    await editarUsuario(req.params.email, req.body);
    enviarRespostaSucesso(res, 'Usuário editado com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao editar usuário', error);
  }
}

// Função principal de listagem
export async function listarTodos(req: Request, res: Response) {
  try {
    const usuarios = await buscarTodosUsuarios();
    enviarDadosJSON(res, usuarios);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar usuários', error);
  }
}

// Função principal de busca por email
export async function buscarPorEmail(req: Request, res: Response) {
  try {
    const usuario = await buscarUsuarioPorEmail(req.params.email);
    if (usuario) {
      enviarDadosJSON(res, usuario);
    } else {
      enviarErro404(res, 'Usuário não encontrado');
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar usuário', error);
  }
}

// Função principal de busca por telefone
export async function buscarPorTelefone(req: Request, res: Response) {
  try {
    const usuario = await buscarUsuarioPorTelefone(req.params.telefone);
    if (usuario) {
      enviarDadosJSON(res, usuario);
    } else {
      enviarErro404(res, 'Usuário não encontrado');
    }
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar usuário', error);
  }
}

// Função principal de deleção
export async function deletar(req: Request, res: Response) {
  try {
    await deletarUsuarioPorEmail(req.params.email);
    enviarRespostaSucesso(res, 'Usuário deletado com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar usuário', error);
  }
}

// Função para obter pontos do usuário
export async function obterPontos(req: Request, res: Response) {
  try {
    const { email } = req.params;
    const usuario = await buscarUsuarioPorEmail(email);
    
    if (!usuario) {
      return enviarErro404(res, 'Usuário não encontrado');
    }
    
    enviarDadosJSON(res, {
      email: usuario.email,
      nome: usuario.nome,
      pontos: usuario.pontos || 0.0
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar pontos do usuário', error);
  }
}

// Função para obter pontos do usuário autenticado
export async function obterMeusPontos(req: Request, res: Response) {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const usuario = await buscarUsuarioPorEmail(req.user.email);
    
    if (!usuario) {
      return enviarErro404(res, 'Usuário não encontrado');
    }
    
    enviarDadosJSON(res, {
      email: usuario.email,
      nome: usuario.nome,
      pontos: usuario.pontos || 0.0
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar seus pontos', error);
  }
}

// Função para remover pontos do usuário (compras)
export async function removerPontos(req: Request, res: Response) {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const { pontos } = req.body;
    
    if (!pontos || pontos <= 0) {
      return enviarRespostaErro(res, 'Quantidade de pontos inválida', null, 400);
    }
    
    const usuario = await buscarUsuarioPorEmail(req.user.email);
    
    if (!usuario) {
      return enviarErro404(res, 'Usuário não encontrado');
    }
    
    const sucesso = await removerPontosUsuario(usuario.id!, pontos);
    
    if (!sucesso) {
      return enviarRespostaErro(res, 'Pontos insuficientes para esta compra', null, 400);
    }
    
    // Buscar pontos atualizados
    const usuarioAtualizado = await buscarUsuarioPorEmail(req.user.email);
    
    enviarDadosJSON(res, {
      message: `${pontos} pontos removidos com sucesso!`,
      pontosRestantes: usuarioAtualizado?.pontos || 0.0
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao remover pontos', error);
  }
}
