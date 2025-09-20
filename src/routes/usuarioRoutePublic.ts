import { Router } from 'express';
import { cadastrar } from '../controllers/usuarioController';

const router = Router();

// Rota pública - cadastro de usuário (não precisa de autenticação)
router.post('/', cadastrar);

export default router;