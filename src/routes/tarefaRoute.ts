import { Router } from 'express';
import * as tarefaController from '../controllers/tarefaController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de tarefa são protegidas
router.post('/', autenticarJWT, tarefaController.criarTarefa);

// Listar tarefas por workspace
router.get('/workspace/:id_workspace', autenticarJWT, tarefaController.listarTarefasPorWorkspace);

// Buscar tarefas por responsável em um workspace
router.get('/workspace/:id_workspace/responsavel/:email', autenticarJWT, tarefaController.buscarTarefasPorResponsavel);

// Buscar tarefas com filtros em um workspace
router.get('/workspace/:id_workspace/filtros', autenticarJWT, tarefaController.buscarTarefasComFiltros);

// Buscar tarefa por título em um workspace
router.get('/workspace/:id_workspace/titulo/:titulo', autenticarJWT, tarefaController.buscarTarefaPorTituloEWorkspace);

// Atualizar tarefa por ID
router.put('/:id_tarefa', autenticarJWT, tarefaController.atualizarTarefa);

// Deletar tarefa por ID
router.delete('/:id_tarefa', autenticarJWT, tarefaController.deletarTarefa);

export default router;
