import { Request, Response } from 'express';
import * as tarefaRecorrenteService from '../services/tarefaRecorrenteService';

export async function criarTarefaRecorrente(req: Request, res: Response) {
  try {
    const tarefa = req.body;
    await tarefaRecorrenteService.criarTarefaRecorrente(tarefa);
    res.status(201).json({ message: 'Tarefa recorrente criada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa recorrente', details: error });
  }
}

export async function buscarTarefasRecorrentes(req: Request, res: Response) {
  try {
    const filtros = req.query;
    const tarefas = await tarefaRecorrenteService.buscarTarefasRecorrentes(filtros);
    res.json(tarefas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas recorrentes', details: error });
  }
}

export async function buscarTarefaRecorrentePorNome(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const tarefa = await tarefaRecorrenteService.buscarTarefaRecorrentePorNome(titulo);
    if (!tarefa) {
      return res.status(404).json({ error: 'Tarefa recorrente não encontrada' });
    }
    res.json(tarefa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefa recorrente', details: error });
  }
}

export async function atualizarTarefaRecorrente(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const dados = req.body;
    await tarefaRecorrenteService.atualizarTarefaRecorrente(titulo, dados);
    res.json({ message: 'Tarefa recorrente atualizada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa recorrente', details: error });
  }
}

export async function deletarTarefaRecorrentePorNome(req: Request, res: Response) {
  try {
    const { titulo } = req.params;
    const { email } = req.body;
    const deletado = await tarefaRecorrenteService.deletarTarefaRecorrentePorNome(titulo, email);
    if (!deletado) {
      return res.status(403).json({ error: 'Não autorizado a deletar esta tarefa recorrente' });
    }
    res.json({ message: 'Tarefa recorrente deletada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa recorrente', details: error });
  }
}
