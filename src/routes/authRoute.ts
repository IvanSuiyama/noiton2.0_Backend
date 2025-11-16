import { Router } from 'express';
import { login } from '../controllers/authController';
import { loginGoogle } from '../controllers/singinGoogleController.';
import { verificarEmail } from '../controllers/verificaemailGoogleController';

const router = Router();

router.post('/login', login);
router.post('/login-google', loginGoogle);
router.get('/verificar-email', verificarEmail);

export default router;
