import { Router } from 'express';
import * as tarefaController from '../controllers/tarefaController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de tarefa são protegidas
router.post('/', autenticarJWT, tarefaController.criarTarefa);
router.get('/', autenticarJWT, tarefaController.buscarTarefas);
router.get('/:titulo', autenticarJWT, tarefaController.buscarTarefaPorNome);
router.put('/:titulo', autenticarJWT, tarefaController.atualizarTarefa);
router.delete('/:titulo', autenticarJWT, tarefaController.deletarTarefaPorNome);

export default router;
