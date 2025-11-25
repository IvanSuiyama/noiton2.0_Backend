import { Router } from 'express';
import { 
  listarTodasDenuncias,
  atualizarStatusDenuncia,
  aprovarDenuncia,
  rejeitarDenuncia,
  listarTodasTarefas,
  deletarTarefaAdmin,
  forcarDelecaoTarefa,
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
router.post('/denuncias/:id/aprovar', aprovarDenuncia);
router.delete('/denuncias/:id/rejeitar', rejeitarDenuncia);

// ====================================
// ROTAS DE TAREFAS
// ====================================
router.get('/tarefas', listarTodasTarefas);
router.delete('/tarefas/:id_tarefa', deletarTarefaAdmin);
router.post('/tarefas/:id_tarefa/forcar-delecao', forcarDelecaoTarefa);

// ====================================
// ROTAS DE USUÁRIOS
// ====================================
router.get('/usuarios', listarTodosUsuarios);

export default router;