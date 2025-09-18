import { Router } from 'express';
import {
  criar,
  listarPorEmail,
  buscarPorNome,
  atualizar,
  deletar
} from '../controllers/workspaceController';

const router = Router();

router.post('/', criar);
router.get('/email/:email', listarPorEmail);
router.get('/nome/:nome', buscarPorNome);
router.put('/:nome', atualizar);
router.delete('/:nome', deletar);

export default router;
