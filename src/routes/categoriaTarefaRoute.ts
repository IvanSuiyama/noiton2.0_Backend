import { Router } from 'express';
import * as tarefaController from '../controllers/tarefaController';

const router = Router();

// Associar categorias à tarefa (usando o mesmo padrão das rotas funcionais)
router.post('/:id_tarefa/categorias', tarefaController.associarCategorias);

// Listar categorias de uma tarefa
router.get('/:id_tarefa/categorias', tarefaController.listarCategoriasDaTarefa);

export default router;