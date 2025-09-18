import { Router } from 'express';
import {
  criar,
  listar,
  buscarPorNome,
  atualizar,
  deletar
} from '../controllers/categoriaController';

const router = Router();

router.post('/', criar);
router.get('/', listar);
router.get('/nome/:nome', buscarPorNome);
router.put('/:id_categoria', atualizar);
router.delete('/:id_categoria', deletar);

export default router;
