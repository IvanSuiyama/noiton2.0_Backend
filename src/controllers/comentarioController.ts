import { Request, Response } from 'express';
import {
  criarComentario,
  buscarComentariosPorEmail,
  buscarComentariosPorTarefa,
  buscarComentarioPorId,
  editarComentario,
  deletarComentario,
  buscarTodosComentarios
} from '../services/comentarioService';

// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// Função auxiliar específica para comentário não autorizado
export function enviarErroComentarioNaoAutorizado(res: Response): void {
  res.status(403).json({ error: 'Só o autor do comentário pode editá-lo ou deletá-lo.' });
}

// Função auxiliar para extrair dados do comentário
export function extrairDadosComentario(req: Request): any {
  return req.body;
}

// Função principal de criação
export async function criar(req: Request, res: Response) {
  try {
    const comentario = extrairDadosComentario(req);
    await criarComentario(comentario);
    enviarRespostaSucesso(res, 'Comentário criado com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar comentário', error);
  }
}

// Função principal de busca por email
export async function buscarPorEmail(req: Request, res: Response) {
  try {
    const { email } = req.params;
    const comentarios = await buscarComentariosPorEmail(email);
    enviarDadosJSON(res, comentarios);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar comentários por email', error);
  }
}

// Função principal de busca por tarefa
export async function buscarPorTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    const comentarios = await buscarComentariosPorTarefa(Number(id_tarefa));
    enviarDadosJSON(res, comentarios);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar comentários por tarefa', error);
  }
}

// Função principal de busca por ID
export async function buscarPorId(req: Request, res: Response) {
  try {
    const { id_comentario } = req.params;
    const comentario = await buscarComentarioPorId(Number(id_comentario));
    if (!comentario) {
      return enviarErro404(res, 'Comentário não encontrado');
    }
    enviarDadosJSON(res, comentario);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar comentário', error);
  }
}

// Função principal de listagem
export async function listarTodos(req: Request, res: Response) {
  try {
    const comentarios = await buscarTodosComentarios();
    enviarDadosJSON(res, comentarios);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar comentários', error);
  }
}

// Função principal de edição
export async function editar(req: Request, res: Response) {
  try {
    const { id_comentario } = req.params;
    const { descricao, email } = req.body;
    
    // Verificar se o comentário existe e se o usuário é o dono
    const comentario = await buscarComentarioPorId(Number(id_comentario));
    if (!comentario) {
      return enviarErro404(res, 'Comentário não encontrado');
    }
    
    if (comentario.email !== email) {
      return enviarErroComentarioNaoAutorizado(res);
    }
    
    await editarComentario(Number(id_comentario), descricao);
    enviarRespostaSucesso(res, 'Comentário editado com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao editar comentário', error);
  }
}

// Função principal de deleção
export async function deletar(req: Request, res: Response) {
  try {
    const { id_comentario } = req.params;
    const { email } = req.body;
    
    const deletado = await deletarComentario(Number(id_comentario), email);
    if (!deletado) {
      return enviarErroComentarioNaoAutorizado(res);
    }
    
    enviarRespostaSucesso(res, 'Comentário deletado com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar comentário', error);
  }
}