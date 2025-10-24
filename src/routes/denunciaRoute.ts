import { Router } from 'express';
import { criar, listar, buscarPorId, buscarPorTarefa, atualizarStatus, estatisticas } from '../controllers/denunciaController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(autenticarJWT);

router.post('/', criar);
router.get('/', listar);
router.get('/estatisticas', estatisticas);
router.get('/tarefa/:id_tarefa', buscarPorTarefa);
router.get('/:id', buscarPorId);
router.put('/:id/status', atualizarStatus);

export default router;