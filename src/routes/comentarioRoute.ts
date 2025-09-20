import { Router } from 'express';
import * as comentarioController from '../controllers/comentarioController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Rotas protegidas (requerem autenticação)
router.post('/comentarios', autenticarJWT, comentarioController.criar);
router.get('/comentarios', autenticarJWT, comentarioController.listarTodos);
router.get('/comentarios/email/:email', autenticarJWT, comentarioController.buscarPorEmail);
router.get('/comentarios/tarefa/:id_tarefa', autenticarJWT, comentarioController.buscarPorTarefa);
router.get('/comentarios/:id_comentario', autenticarJWT, comentarioController.buscarPorId);
router.put('/comentarios/:id_comentario', autenticarJWT, comentarioController.editar);
router.delete('/comentarios/:id_comentario', autenticarJWT, comentarioController.deletar);

export default router;