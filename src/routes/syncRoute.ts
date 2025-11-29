import { Router } from 'express';
import { 
  processarSyncOffline, 
  obterDadosParaSync 
} from '../controllers/syncController';

const router = Router();

// Rota para sincronizar operações offline
router.post('/offline', processarSyncOffline);

// Rota para obter dados completos para sincronização inicial
router.get('/initial-data/:user_email', obterDadosParaSync);

export default router;