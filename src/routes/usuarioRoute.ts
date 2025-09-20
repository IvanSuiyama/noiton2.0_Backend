
import { Router } from 'express';
import { editar, listarTodos, buscarPorEmail, buscarPorTelefone, deletar } from '../controllers/usuarioController';

const router = Router();

router.put('/:email', editar);
router.get('/', listarTodos);
router.get('/email/:email', buscarPorEmail);
router.get('/telefone/:telefone', buscarPorTelefone);
router.delete('/:email', deletar);

export default router;
