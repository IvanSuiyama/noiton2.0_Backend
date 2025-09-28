import { Router } from 'express';
import {
  criar,
  listarPorEmail,
  buscarporID,
  atualizar,
  deletar,
  adicionarEmailAoWorkspace,
  removerEmailDoWorkspace
} from '../controllers/workspaceController';

const router = Router();

router.post('/', criar);
router.get('/email/:email', listarPorEmail);
router.get('/id/:id_workspace', buscarporID);
router.put('/:id_workspace', atualizar);
router.delete('/:id_workspace', deletar);

// Adiciona um novo email a um workspace existente
router.post('/:id_workspace/adicionar-email', adicionarEmailAoWorkspace);
// Remove um email de um workspace existente
router.delete('/:id_workspace/remover-email', removerEmailDoWorkspace);

export default router;
