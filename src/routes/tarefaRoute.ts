import { Router } from 'express';
import * as tarefaController from '../controllers/tarefaController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de tarefa são protegidas

// Criar tarefa (agora com workspace no body)
router.post('/', autenticarJWT, tarefaController.criarTarefa);

// Listar tarefas por workspace
router.get('/workspace/:id_workspace', autenticarJWT, tarefaController.listarTarefasPorWorkspace);

// Buscar tarefas por usuário em um workspace (agora por ID do usuário)
router.get('/workspace/:id_workspace/usuario', autenticarJWT, tarefaController.buscarTarefasPorUsuarioEWorkspace);
router.get('/workspace/:id_workspace/usuario/:id_usuario', autenticarJWT, tarefaController.buscarTarefasPorUsuarioEWorkspace);

// Buscar tarefas com filtros em um workspace
router.get('/workspace/:id_workspace/filtros', autenticarJWT, tarefaController.buscarTarefasComFiltros);

// Buscar tarefa por ID e workspace (nova rota)
router.get('/workspace/:id_workspace/tarefa/:id_tarefa', autenticarJWT, tarefaController.buscarTarefaPorIdEWorkspace);

// Buscar tarefa por título (agora apenas por título, sem workspace na URL)
router.get('/titulo/:titulo', autenticarJWT, tarefaController.buscarTarefaPorTituloEUsuario);

// Atualizar tarefa por ID
router.put('/:id_tarefa', autenticarJWT, tarefaController.atualizarTarefa);

// Deletar tarefa por ID
router.delete('/:id_tarefa', autenticarJWT, tarefaController.deletarTarefa);

// Rotas de categorias da tarefa
router.post('/:id_tarefa/categorias', autenticarJWT, tarefaController.associarCategorias);
router.get('/:id_tarefa/categorias', autenticarJWT, tarefaController.listarCategoriasDaTarefa);
router.delete('/:id_tarefa/categorias', autenticarJWT, tarefaController.removerCategorias);
router.delete('/:id_tarefa/categorias/:id_categoria', autenticarJWT, tarefaController.removerCategorias);

// Rotas de associação com workspace
router.post('/:id_tarefa/workspace', autenticarJWT, tarefaController.associarTarefaAWorkspace);
router.delete('/:id_tarefa/workspace/:id_workspace', autenticarJWT, tarefaController.removerTarefaDeWorkspace);


export default router;