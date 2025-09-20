import { Request, Response } from 'express';
import * as tarefaService from '../services/tarefaService';

// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// Função auxiliar específica para tarefa não autorizada
export function enviarErroNaoAutorizado(res: Response, message: string): void {
  res.status(403).json({ error: message });
}

// Função auxiliar para processar request de tarefa
export function extrairDadosTarefa(req: Request): any {
  return req.body;
}

// Função auxiliar para extrair filtros de busca
export function extrairFiltrosBusca(req: Request): any {
  return req.query;
}

// Função principal de criação
export async function criarTarefa(req: Request, res: Response) {
  try {
    const tarefa = extrairDadosTarefa(req);
    await tarefaService.criarTarefa(tarefa);
    enviarRespostaSucesso(res, 'Tarefa criada com sucesso!', 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao criar tarefa', error, 500);
  }
}

// Função principal de busca
export async function buscarTarefas(req: Request, res: Response) {
  try {
    const filtros = extrairFiltrosBusca(req);
    const tarefas = await tarefaService.buscarTarefas(filtros);
    enviarDadosJSON(res, tarefas);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefas', error, 500);
  }
}

// Função principal de busca por nome
export async function buscarTarefaPorNome(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const tarefa = await tarefaService.buscarTarefaPorNome(titulo);
    if (!tarefa) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    enviarDadosJSON(res, tarefa);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar tarefa', error, 500);
  }
}

// Função principal de atualização
export async function atualizarTarefa(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const dados = extrairDadosTarefa(req);
    await tarefaService.atualizarTarefa(titulo, dados);
    enviarRespostaSucesso(res, 'Tarefa atualizada com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar tarefa', error, 500);
  }
}

// Função principal de deleção
export async function deletarTarefaPorNome(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const { email } = req.body;
    const deletado = await tarefaService.deletarTarefaPorNome(titulo, email);
    if (!deletado) {
      return enviarErroNaoAutorizado(res, 'Não autorizado a deletar esta tarefa');
    }
    enviarRespostaSucesso(res, 'Tarefa deletada com sucesso!');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar tarefa', error, 500);
  }
}
