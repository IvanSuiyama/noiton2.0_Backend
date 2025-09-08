import { Router } from 'express';
import usuarioRoute from './usuarioRoute';
import authRoute from './authRoute';
const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});


router.use('/auth', authRoute);

export default router;
