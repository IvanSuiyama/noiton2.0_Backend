import { Router } from 'express';
import {
  criar,
  listarPorEmail,
  buscarPorNome,
  atualizar,
  deletar,
  adicionarEmailAoWorkspace,
  removerEmailDoWorkspace
} from '../controllers/workspaceController';

const router = Router();

router.post('/', criar);
router.get('/email/:email', listarPorEmail);
router.get('/nome/:nome', buscarPorNome);
router.put('/:nome', atualizar);
router.delete('/:nome', deletar);

// Adiciona um novo email a um workspace existente
router.post('/:id_workspace/adicionar-email', adicionarEmailAoWorkspace);
// Remove um email de um workspace existente
router.delete('/:id_workspace/remover-email', removerEmailDoWorkspace);

export default router;
