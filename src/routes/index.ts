import { Router } from 'express';
import authRoute from './authRoute';
import usuarioRoutePublic from './usuarioRoutePublic';
import usuarioRoute from './usuarioRoute';
import workspaceRoute from './workspaceRoute';
import categoriaRoute from './categoriaRoute';
import comentarioRoute from './comentarioRoute';
import tarefaRoute from './tarefaRoute';
import permissaoRoute from './permissaoRoute';
import denunciaRoute from './denunciaRoute';
import anexoTarefaRoute from './anexoTarefaRoute';
import { autenticarJWT } from '../middlewares/authMiddleware';
const router = Router();


router.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});



// Rotas públicas
router.use('/usuarios', usuarioRoutePublic); // Só cadastro de usuário é livre
router.use('/auth', authRoute); // /auth/login

// Middleware de autenticação para todas as rotas abaixo
router.use(autenticarJWT);

// Rotas protegidas
router.use('/usuarios', usuarioRoute); // Todas as outras operações de usuário protegidas
router.use('/categorias', categoriaRoute);
router.use('/workspaces', workspaceRoute);
router.use('/tarefas', tarefaRoute);
router.use('/', comentarioRoute); // Rotas de comentários
router.use('/', permissaoRoute); // Rotas de permissões
router.use('/denuncias', denunciaRoute); // Rotas de denúncias
router.use('/', anexoTarefaRoute); // Rotas de anexos de tarefas

export default router;
