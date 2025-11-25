import { Router } from 'express';
import { 
  listarTodasDenuncias,
  atualizarStatusDenuncia,
  listarTodasTarefas,
  deletarTarefaAdmin,
  listarTodosUsuarios,
  dashboard
} from '../controllers/adminController';
import { autenticarAdmin } from '../middlewares/adminMiddleware';

const router = Router();

// Middleware de autenticação admin para todas as rotas
router.use(autenticarAdmin);

// ====================================
// ROTAS DE DASHBOARD
// ====================================
router.get('/dashboard', dashboard);

// ====================================
// ROTAS DE DENÚNCIAS
// ====================================
router.get('/denuncias', listarTodasDenuncias);
router.put('/denuncias/:id/status', atualizarStatusDenuncia);

// ====================================
// ROTAS DE TAREFAS
// ====================================
router.get('/tarefas', listarTodasTarefas);
router.delete('/tarefas/:id_tarefa', deletarTarefaAdmin);

// ====================================
// ROTAS DE USUÁRIOS
// ====================================
router.get('/usuarios', listarTodosUsuarios);

export default router;