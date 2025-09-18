import { Router } from 'express';
import authRoute from './authRoute';
import workspaceRoute from './workspaceRoute';
import categoriaRoute from './categoriaRoute';
import { autenticarJWT } from '../middlewares/authMiddleware';
const router = Router();


router.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});



// Rotas públicas
router.use('/usuarios', require('./usuarioRoute').default); // Todas as rotas de usuário são livres
router.use('/auth', authRoute); // /auth/login

// Middleware de autenticação para todas as rotas abaixo
router.use(autenticarJWT);

// Rotas protegidas
router.use('/categorias', categoriaRoute);
router.use('/workspaces', workspaceRoute);
router.use('/tarefas', require('./tarefaRoute').default);
router.use('/tarefas_recorrentes', require('./tarefaRecorrenteRoute').default);

export default router;
