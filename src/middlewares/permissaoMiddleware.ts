import { Request, Response, NextFunction } from 'express';
import { podeRealizarAcao } from '../services/permissaoService';

// Middleware para verificar se o usuário pode ver uma tarefa
export async function verificarPermissaoVer(req: Request, res: Response, next: NextFunction) {
  try {
    const idTarefa = parseInt(req.params.id || req.params.idTarefa);
    const usuarioLogado = (req as any).usuario?.id_usuario;

    if (!idTarefa || !usuarioLogado) {
      return res.status(400).json({ error: 'ID da tarefa ou usuário inválido' });
    }

    const podeVer = await podeRealizarAcao(idTarefa, usuarioLogado, 'ver');
    if (!podeVer) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para visualizar esta tarefa' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões', details: error });
  }
}

// Middleware para verificar se o usuário pode editar uma tarefa
export async function verificarPermissaoEditar(req: Request, res: Response, next: NextFunction) {
  try {
    const idTarefa = parseInt(req.params.id || req.params.idTarefa);
    const usuarioLogado = (req as any).usuario?.id_usuario;

    if (!idTarefa || !usuarioLogado) {
      return res.status(400).json({ error: 'ID da tarefa ou usuário inválido' });
    }

    const podeEditar = await podeRealizarAcao(idTarefa, usuarioLogado, 'editar');
    if (!podeEditar) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para editar esta tarefa' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões', details: error });
  }
}

// Middleware para verificar se o usuário pode apagar uma tarefa
export async function verificarPermissaoApagar(req: Request, res: Response, next: NextFunction) {
  try {
    const idTarefa = parseInt(req.params.id || req.params.idTarefa);
    const usuarioLogado = (req as any).usuario?.id_usuario;

    if (!idTarefa || !usuarioLogado) {
      return res.status(400).json({ error: 'ID da tarefa ou usuário inválido' });
    }

    const podeApagar = await podeRealizarAcao(idTarefa, usuarioLogado, 'apagar');
    if (!podeApagar) {
      return res.status(403).json({ 
        error: 'Apenas o criador da tarefa pode apagá-la' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões', details: error });
  }
}