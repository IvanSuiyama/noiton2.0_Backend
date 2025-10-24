import { Request, Response } from 'express';
import * as denunciaService from '../services/denunciaService';
// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// Função auxiliar específica para validar motivo da denúncia
export function validarMotivoDenuncia(motivo: string): boolean {
  return Boolean(motivo && motivo.trim().length >= 10);
}

// Função principal de criação
export async function criar(req: Request, res: Response) {
  try {
    const { id_tarefa, motivo } = req.body;
    const id_usuario_denunciante = req.user?.id_usuario;

    // Validações básicas
    if (!id_tarefa || !motivo || !id_usuario_denunciante) {
      return enviarRespostaErro(res, 'ID da tarefa, motivo e usuário são obrigatórios', null, 400);
    }

    if (!validarMotivoDenuncia(motivo)) {
      return enviarRespostaErro(res, 'O motivo da denúncia deve ter pelo menos 10 caracteres', null, 400);
    }

    // Verificar se a tarefa existe
    const tarefaExiste = await denunciaService.verificarTarefaExiste(id_tarefa);
    if (!tarefaExiste) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }

    // Verificar se o usuário já denunciou esta tarefa
    const jaDenunciou = await denunciaService.verificarUsuarioJaDenunciou(id_tarefa, id_usuario_denunciante);
    if (jaDenunciou) {
      return enviarRespostaErro(res, 'Você já denunciou esta tarefa anteriormente', null, 409);
    }

    // Criar a denúncia
    const dadosDenuncia = {
      id_tarefa,
      id_usuario_denunciante,
      motivo: motivo.trim()
    };

    await denunciaService.criarDenuncia(dadosDenuncia);
    enviarRespostaSucesso(res, 'Obrigado por denunciar, nossos moderadores vão analisar o conteúdo dessa tarefa.', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar denúncia', error);
  }
}

// Função principal de listagem
export async function listar(req: Request, res: Response) {
  try {
    const { status } = req.query;
    
    const denuncias = await denunciaService.listarTodasDenuncias(status as string);
    enviarDadosJSON(res, denuncias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar denúncias', error);
  }
}

// Função principal de busca por tarefa
export async function buscarPorTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa || isNaN(Number(id_tarefa))) {
      return enviarRespostaErro(res, 'ID da tarefa inválido', null, 400);
    }

    const denuncias = await denunciaService.buscarDenunciasPorTarefa(Number(id_tarefa));
    enviarDadosJSON(res, denuncias);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar denúncias da tarefa', error);
  }
}

// Função principal de busca por ID
export async function buscarPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return enviarRespostaErro(res, 'ID da denúncia inválido', null, 400);
    }

    const denuncia = await denunciaService.buscarDenunciaPorId(Number(id));
    
    if (!denuncia) {
      return enviarErro404(res, 'Denúncia não encontrada');
    }

    enviarDadosJSON(res, denuncia);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar denúncia', error);
  }
}

// Função principal de atualização de status
export async function atualizarStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;
    const id_moderador = req.user?.id_usuario;

    // Validações
    if (!id || isNaN(Number(id))) {
      return enviarRespostaErro(res, 'ID da denúncia inválido', null, 400);
    }

    if (!status || !['analisada', 'rejeitada', 'aprovada'].includes(status)) {
      return enviarRespostaErro(res, 'Status inválido. Use: analisada, rejeitada ou aprovada', null, 400);
    }

    if (!id_moderador) {
      return enviarRespostaErro(res, 'Usuário não autenticado', null, 401);
    }

    const sucesso = await denunciaService.atualizarStatusDenuncia(
      Number(id),
      status,
      id_moderador,
      observacoes
    );

    if (!sucesso) {
      return enviarErro404(res, 'Denúncia não encontrada ou já processada');
    }

    enviarRespostaSucesso(res, 'Status da denúncia atualizado com sucesso');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar status da denúncia', error);
  }
}

// Função principal de estatísticas
export async function estatisticas(req: Request, res: Response) {
  try {
    const stats = await denunciaService.obterEstatisticasDenuncias();
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    enviarDadosJSON(res, {
      por_status: stats,
      total
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar estatísticas de denúncias', error);
  }
}