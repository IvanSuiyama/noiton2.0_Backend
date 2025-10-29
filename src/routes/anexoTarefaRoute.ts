import { Router } from 'express';
import multer from 'multer';
import {
  adicionarAnexo,
  listarAnexosTarefa,
  buscarAnexoPorId,
  baixarAnexo,
  atualizarAnexo,
  deletarAnexo,
  deletarTodosAnexosTarefa
} from '../controllers/anexoTarefaController';
import { autenticarJWT } from '../middlewares/authMiddleware';

const router = Router();

// Configuração do multer para upload temporário
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB máximo
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Permitir apenas PDF e imagens
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use apenas PDF ou imagens (JPEG, PNG, GIF, WebP).'));
    }
  }
});

// Aplicar middleware de autenticação em todas as rotas
router.use(autenticarJWT);

// Rotas para anexos de tarefas
router.post('/tarefa/:id_tarefa/anexo', upload.single('arquivo'), adicionarAnexo);
router.get('/tarefa/:id_tarefa/anexos', listarAnexosTarefa);
router.get('/anexo/:id_anexo', buscarAnexoPorId);
router.get('/anexo/:id_anexo/download', baixarAnexo);
router.put('/anexo/:id_anexo', upload.single('arquivo'), atualizarAnexo);
router.delete('/anexo/:id_anexo', deletarAnexo);
router.delete('/tarefa/:id_tarefa/anexos', deletarTodosAnexosTarefa);

export default router;