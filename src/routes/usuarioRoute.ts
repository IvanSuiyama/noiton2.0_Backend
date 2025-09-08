
import { Router } from 'express';
import {
  cadastrar,
  editar,
  listarTodos,
  buscarPorEmail,
  buscarPorTelefone,
  deletar
} from '../controllers/usuarioController';

const router = Router();

router.post('/', cadastrar);
router.put('/:email', editar);
router.get('/', listarTodos);
router.get('/email/:email', buscarPorEmail);
router.get('/telefone/:telefone', buscarPorTelefone);
router.delete('/:email', deletar);

export default router;
