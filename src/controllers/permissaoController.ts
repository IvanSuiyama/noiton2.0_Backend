import { Request, Response } from 'express';
import {
  adicionarPermissao,
  listarPermissoesTarefa,
  removerPermissao,
  verificarPermissaoUsuario,
  podeRealizarAcao,
  obterDescricaoNivel,
  obterPermissoesDetalhadas
} from '../services/permissaoService';

// Função para adicionar permissão a um usuário
export async function adicionarPermissaoUsuario(req: Request, res: Response) {
  try {
    const { id_tarefa, id_usuario, nivel_acesso } = req.body;
    const usuarioLogado = (req as any).usuario?.id_usuario;

    // Verifica se o usuário logado pode gerenciar permissões (deve ser criador)
    const podeGerenciar = await podeRealizarAcao(id_tarefa, usuarioLogado, 'apagar');
    if (!podeGerenciar) {
      return res.status(403).json({ 
        error: 'Apenas o criador da tarefa pode gerenciar permissões' 
      });
    }

    await adicionarPermissao({ id_tarefa, id_usuario, nivel_acesso });
    res.status(201).json({ message: 'Permissão adicionada com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao adicionar permissão', details: error });
  }
}

// Função para listar permissões de uma tarefa
export async function listarPermissoes(req: Request, res: Response) {
  try {
    const idTarefa = parseInt(req.params.idTarefa);
    const usuarioLogado = (req as any).usuario?.id_usuario;

    // Verifica se o usuário tem permissão para ver a tarefa
    const podeVer = await podeRealizarAcao(idTarefa, usuarioLogado, 'ver');
    if (!podeVer) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para ver esta tarefa' 
      });
    }

    const permissoes = await listarPermissoesTarefa(idTarefa);
    res.json(permissoes);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar permissões', details: error });
  }
}

// Função para remover permissão de um usuário
export async function removerPermissaoUsuario(req: Request, res: Response) {
  try {
    const idTarefa = parseInt(req.params.idTarefa);
    const idUsuario = parseInt(req.params.idUsuario);
    const usuarioLogado = (req as any).usuario?.id_usuario;

    // Verifica se o usuário logado pode gerenciar permissões (deve ser criador)
    const podeGerenciar = await podeRealizarAcao(idTarefa, usuarioLogado, 'apagar');
    if (!podeGerenciar) {
      return res.status(403).json({ 
        error: 'Apenas o criador da tarefa pode gerenciar permissões' 
      });
    }

    await removerPermissao(idTarefa, idUsuario);
    res.json({ message: 'Permissão removida com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao remover permissão', details: error });
  }
}

// Função para verificar permissão do usuário logado
export async function verificarMinhaPermissao(req: Request, res: Response) {
  try {
    const idTarefa = parseInt(req.params.idTarefa);
    const usuarioLogado = (req as any).usuario?.id_usuario;

    const nivelPermissao = await verificarPermissaoUsuario(idTarefa, usuarioLogado);
    
    if (nivelPermissao === null) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para esta tarefa' 
      });
    }

    const nivel = nivelPermissao as 0 | 1 | 2;
    const permissoesDetalhadas = obterPermissoesDetalhadas(nivel);
    
    const permissoes = {
      nivel_acesso: nivel,
      descricao: obterDescricaoNivel(nivel),
      ...permissoesDetalhadas
    };

    res.json(permissoes);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao verificar permissão', details: error });
  }
}