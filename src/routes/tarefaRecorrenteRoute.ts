import { Router } from 'express';
import * as tarefaRecorrenteController from '../controllers/tarefaRecorrenteController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de tarefa recorrente são protegidas
router.post('/', autenticarJWT, tarefaRecorrenteController.criarTarefaRecorrente);
router.get('/', autenticarJWT, tarefaRecorrenteController.buscarTarefasRecorrentes);
router.get('/:titulo', autenticarJWT, tarefaRecorrenteController.buscarTarefaRecorrentePorNome);
router.put('/:titulo', autenticarJWT, tarefaRecorrenteController.atualizarTarefaRecorrente);
router.delete('/:titulo', autenticarJWT, tarefaRecorrenteController.deletarTarefaRecorrentePorNome);

export default router;
