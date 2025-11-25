import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// ====================================
// FUNÇÕES DE DENÚNCIAS PARA ADMIN
// ====================================

// Listar todas as denúncias (sem filtros de usuário)
export async function listarTodasDenuncias(req: Request, res: Response) {
  try {
    const { status } = req.query;
    
    const denuncias = await adminService.buscarTodasDenunciasAdmin(status as string);
    
    enviarDadosJSON(res, {
      admin: true,
      total: denuncias.length,
      denuncias: denuncias
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar denúncias (admin)', error);
  }
}

// Atualizar status de denúncia como admin
export async function atualizarStatusDenuncia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;

    // Validações
    if (!id || isNaN(Number(id))) {
      return enviarRespostaErro(res, 'ID da denúncia inválido', null, 400);
    }

    if (!status || !['analisada', 'rejeitada', 'aprovada'].includes(status)) {
      return enviarRespostaErro(res, 'Status inválido. Use: analisada, rejeitada ou aprovada', null, 400);
    }

    const sucesso = await adminService.atualizarStatusDenunciaAdmin(
      Number(id),
      status,
      observacoes || 'Processado pelo administrador'
    );

    if (!sucesso) {
      return enviarErro404(res, 'Denúncia não encontrada ou já processada');
    }

    enviarRespostaSucesso(res, `Denúncia ${status} pelo administrador`);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar denúncia (admin)', error);
  }
}

// ====================================
// FUNÇÕES DE TAREFAS PARA ADMIN
// ====================================

// Listar todas as tarefas do sistema
export async function listarTodasTarefas(req: Request, res: Response) {
  try {
    const tarefas = await adminService.buscarTodasTarefasAdmin();
    
    enviarDadosJSON(res, {
      admin: true,
      total: tarefas.length,
      tarefas: tarefas
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar tarefas (admin)', error);
  }
}

// Deletar qualquer tarefa como admin
export async function deletarTarefaAdmin(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa || isNaN(Number(id_tarefa))) {
      return enviarRespostaErro(res, 'ID da tarefa inválido', null, 400);
    }

    const sucesso = await adminService.deletarTarefaAdmin(Number(id_tarefa));
    
    if (!sucesso) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }

    enviarRespostaSucesso(res, `Tarefa ${id_tarefa} deletada pelo administrador`);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar tarefa (admin)', error);
  }
}

// ====================================
// FUNÇÕES DE USUÁRIOS PARA ADMIN
// ====================================

// Listar todos os usuários (sem senha)
export async function listarTodosUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await adminService.buscarTodosUsuariosAdmin();
    
    enviarDadosJSON(res, {
      admin: true,
      total: usuarios.length,
      usuarios: usuarios
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao listar usuários (admin)', error);
  }
}

// ====================================
// DASHBOARD DO ADMIN
// ====================================

// Estatísticas gerais do sistema
export async function dashboard(req: Request, res: Response) {
  try {
    const estatisticas = await adminService.obterEstatisticasGerais();

    enviarDadosJSON(res, {
      admin: true,
      timestamp: new Date().toISOString(),
      estatisticas: estatisticas,
      sistema: {
        status: 'online',
        versao: '1.0.0'
      }
    });
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao carregar dashboard (admin)', error);
  }
}