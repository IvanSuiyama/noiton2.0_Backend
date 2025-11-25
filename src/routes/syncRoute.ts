import { Router } from 'express';
import { processarSyncOffline } from '../controllers/syncController';

const router = Router();

router.post('/offline', processarSyncOffline);

export default router;
