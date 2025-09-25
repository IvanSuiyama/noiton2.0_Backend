import { Router } from 'express';
import {
  criar,
  listarPorWorkspace,
  buscarPorNomeEWorkspace,
  buscarPorNome,
  atualizar,
  deletar
} from '../controllers/categoriaController';

const router = Router();

// Criar categoria (POST)
router.post('/', criar);

// Listar categorias por workspace (GET)
router.get('/workspace/:id_workspace', listarPorWorkspace);

// Buscar categoria por nome em um workspace específico (GET)
router.get('/workspace/:id_workspace/nome/:nome', buscarPorNomeEWorkspace);

// Buscar categoria por nome (compatibilidade - requer id_workspace como query param) (GET)
router.get('/nome/:nome', buscarPorNome);

// Atualizar categoria (PUT)
router.put('/:id_categoria', atualizar);

// Deletar categoria (DELETE)
router.delete('/:id_categoria', deletar);

export default router;
