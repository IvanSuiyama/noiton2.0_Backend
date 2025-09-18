import { Request, Response } from 'express';
import * as tarefaService from '../services/tarefaService';

export async function criarTarefa(req: Request, res: Response) {
  try {
    const tarefa = req.body;
    await tarefaService.criarTarefa(tarefa);
    res.status(201).json({ message: 'Tarefa criada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa', details: error });
  }
}

export async function buscarTarefas(req: Request, res: Response) {
  try {
    const filtros = req.query;
    const tarefas = await tarefaService.buscarTarefas(filtros);
    res.json(tarefas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas', details: error });
  }
}

export async function buscarTarefaPorNome(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const tarefa = await tarefaService.buscarTarefaPorNome(titulo);
    if (!tarefa) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(tarefa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefa', details: error });
  }
}

export async function atualizarTarefa(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const dados = req.body;
    await tarefaService.atualizarTarefa(titulo, dados);
    res.json({ message: 'Tarefa atualizada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa', details: error });
  }
}

export async function deletarTarefaPorNome(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const { email } = req.body;
    const deletado = await tarefaService.deletarTarefaPorNome(titulo, email);
    if (!deletado) {
      return res.status(403).json({ error: 'Não autorizado a deletar esta tarefa' });
    }
    res.json({ message: 'Tarefa deletada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa', details: error });
  }
}
