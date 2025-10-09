import { Router } from 'express';
import {
  adicionarPermissaoUsuario,
  listarPermissoes,
  removerPermissaoUsuario,
  verificarMinhaPermissao
} from '../controllers/permissaoController';

const router = Router();

// Rota para adicionar permissão a um usuário
router.post('/tarefas/:idTarefa/permissoes', adicionarPermissaoUsuario);

// Rota para listar todas as permissões de uma tarefa
router.get('/tarefas/:idTarefa/permissoes', listarPermissoes);

// Rota para verificar a permissão do usuário logado em uma tarefa
router.get('/tarefas/:idTarefa/minha-permissao', verificarMinhaPermissao);

// Rota para remover permissão de um usuário
router.delete('/tarefas/:idTarefa/permissoes/:idUsuario', removerPermissaoUsuario);

export default router;