import { Request, Response } from 'express';
import * as anexoTarefaService from '../services/anexoTarefaService';
import path from 'path';
import fs from 'fs/promises';
// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaSucesso,
  enviarRespostaErro,
  enviarDadosJSON,
  enviarErro404
} from './usuarioController';

// Extendendo Request para incluir file do multer
interface RequestComArquivo extends Request {
  file?: Express.Multer.File;
}

// Usando o tipo do multer para arquivo de upload
type ArquivoUpload = Express.Multer.File;

// Função auxiliar para validar tamanho do arquivo
export function validarTamanhoArquivo(tamanho: number, tipoArquivo: 'pdf' | 'imagem'): boolean {
  const maxSizePDF = 10 * 1024 * 1024; // 10MB para PDF
  const maxSizeImagem = 15 * 1024 * 1024; // 15MB para imagem
  
  if (tipoArquivo === 'pdf') {
    return tamanho <= maxSizePDF;
  }
  
  if (tipoArquivo === 'imagem') {
    return tamanho <= maxSizeImagem;
  }
  
  return false;
}

// Função auxiliar para determinar tipo do arquivo baseado no mimetype
export function determinarTipoArquivo(mimetype: string): 'pdf' | 'imagem' | null {
  if (mimetype === 'application/pdf') {
    return 'pdf';
  }
  
  const imagensTipos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (imagensTipos.includes(mimetype)) {
    return 'imagem';
  }
  
  return null;
}

// Função principal para adicionar anexo
export async function adicionarAnexo(req: RequestComArquivo, res: Response) {
  try {
    const { id_tarefa } = req.params;
    const arquivo = req.file;
    
    if (!id_tarefa || isNaN(Number(id_tarefa))) {
      return enviarRespostaErro(res, 'ID da tarefa inválido', null, 400);
    }
    
    if (!arquivo) {
      return enviarRespostaErro(res, 'Nenhum arquivo foi enviado', null, 400);
    }
    
    // Verificar se a tarefa existe
    const tarefaExiste = await anexoTarefaService.verificarTarefaExiste(Number(id_tarefa));
    if (!tarefaExiste) {
      return enviarErro404(res, 'Tarefa não encontrada');
    }
    
    // Determinar tipo do arquivo
    const tipoArquivo = determinarTipoArquivo(arquivo.mimetype);
    if (!tipoArquivo) {
      return enviarRespostaErro(res, 'Tipo de arquivo não permitido. Use apenas PDF ou imagens (JPEG, PNG, GIF, WebP)', null, 400);
    }
    
    // Validar mimetype específico
    if (!anexoTarefaService.validarTipoArquivo(arquivo.mimetype, tipoArquivo)) {
      return enviarRespostaErro(res, 'Formato de arquivo inválido', null, 400);
    }
    
    // Validar tamanho do arquivo
    if (!validarTamanhoArquivo(arquivo.size, tipoArquivo)) {
      const maxSize = tipoArquivo === 'pdf' ? '10MB' : '15MB';
      return enviarRespostaErro(res, `Arquivo muito grande. Tamanho máximo para ${tipoArquivo}: ${maxSize}`, null, 400);
    }
    
    // Verificar se já existe anexo do mesmo tipo para esta tarefa
    const anexoExistente = await anexoTarefaService.buscarAnexoPorTarefaETipo(Number(id_tarefa), tipoArquivo);
    if (anexoExistente) {
      return enviarRespostaErro(res, `Já existe um ${tipoArquivo} anexado a esta tarefa. Remova o arquivo atual primeiro.`, null, 409);
    }
    
    // Gerar nome único para o arquivo
    const nomeArquivo = anexoTarefaService.gerarNomeArquivo(arquivo.originalname, Number(id_tarefa), tipoArquivo);
    const caminhoFinal = path.join('uploads', 'tarefas', nomeArquivo);
    
    // Mover arquivo para o diretório final
    await fs.rename(arquivo.path, caminhoFinal);
    
    // Criar registro no banco
    const dadosAnexo = {
      id_tarefa: Number(id_tarefa),
      tipo_arquivo: tipoArquivo,
      nome_arquivo: nomeArquivo,
      nome_original: arquivo.originalname,
      tamanho_arquivo: arquivo.size,
      caminho_arquivo: caminhoFinal
    };
    
    const idAnexo = await anexoTarefaService.criarAnexoTarefa(dadosAnexo);
    
    enviarRespostaSucesso(res, `${tipoArquivo} adicionado com sucesso à tarefa`, 201);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao adicionar anexo à tarefa', error);
  }
}

// Função principal para listar anexos de uma tarefa
export async function listarAnexosTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa || isNaN(Number(id_tarefa))) {
      return enviarRespostaErro(res, 'ID da tarefa inválido', null, 400);
    }
    
    const anexos = await anexoTarefaService.buscarAnexosPorTarefa(Number(id_tarefa));
    enviarDadosJSON(res, anexos);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar anexos da tarefa', error);
  }
}

// Função principal para buscar anexo específico
export async function buscarAnexoPorId(req: Request, res: Response) {
  try {
    const { id_anexo } = req.params;
    
    if (!id_anexo || isNaN(Number(id_anexo))) {
      return enviarRespostaErro(res, 'ID do anexo inválido', null, 400);
    }
    
    const anexo = await anexoTarefaService.buscarAnexoPorId(Number(id_anexo));
    
    if (!anexo) {
      return enviarErro404(res, 'Anexo não encontrado');
    }
    
    enviarDadosJSON(res, anexo);
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao buscar anexo', error);
  }
}

// Função principal para baixar arquivo
export async function baixarAnexo(req: Request, res: Response) {
  try {
    const { id_anexo } = req.params;
    
    if (!id_anexo || isNaN(Number(id_anexo))) {
      return enviarRespostaErro(res, 'ID do anexo inválido', null, 400);
    }
    
    const anexo = await anexoTarefaService.buscarAnexoPorId(Number(id_anexo));
    
    if (!anexo) {
      return enviarErro404(res, 'Anexo não encontrado');
    }
    
    // Verificar se arquivo existe fisicamente
    try {
      await fs.access(anexo.caminho_arquivo);
    } catch {
      return enviarErro404(res, 'Arquivo não encontrado no servidor');
    }
    
    // Configurar headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${anexo.nome_original}"`);
    res.setHeader('Content-Type', anexo.tipo_arquivo === 'pdf' ? 'application/pdf' : 'image/*');
    
    // Enviar arquivo
    res.sendFile(path.resolve(anexo.caminho_arquivo));
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao baixar anexo', error);
  }
}

// Função principal para atualizar anexo (substituir arquivo)
export async function atualizarAnexo(req: RequestComArquivo, res: Response) {
  try {
    const { id_anexo } = req.params;
    const arquivo = req.file;
    
    if (!id_anexo || isNaN(Number(id_anexo))) {
      return enviarRespostaErro(res, 'ID do anexo inválido', null, 400);
    }
    
    if (!arquivo) {
      return enviarRespostaErro(res, 'Nenhum arquivo foi enviado', null, 400);
    }
    
    // Buscar anexo existente
    const anexoExistente = await anexoTarefaService.buscarAnexoPorId(Number(id_anexo));
    if (!anexoExistente) {
      return enviarErro404(res, 'Anexo não encontrado');
    }
    
    // Validar se o tipo do arquivo é o mesmo
    const tipoArquivo = determinarTipoArquivo(arquivo.mimetype);
    if (!tipoArquivo || tipoArquivo !== anexoExistente.tipo_arquivo) {
      return enviarRespostaErro(res, `O arquivo deve ser do mesmo tipo: ${anexoExistente.tipo_arquivo}`, null, 400);
    }
    
    // Validar mimetype específico
    if (!anexoTarefaService.validarTipoArquivo(arquivo.mimetype, tipoArquivo)) {
      return enviarRespostaErro(res, 'Formato de arquivo inválido', null, 400);
    }
    
    // Validar tamanho do arquivo
    if (!validarTamanhoArquivo(arquivo.size, tipoArquivo)) {
      const maxSize = tipoArquivo === 'pdf' ? '10MB' : '15MB';
      return enviarRespostaErro(res, `Arquivo muito grande. Tamanho máximo para ${tipoArquivo}: ${maxSize}`, null, 400);
    }
    
    // Gerar novo nome para o arquivo
    const nomeArquivo = anexoTarefaService.gerarNomeArquivo(arquivo.originalname, anexoExistente.id_tarefa, tipoArquivo);
    const caminhoFinal = path.join('uploads', 'tarefas', nomeArquivo);
    
    // Mover arquivo para o diretório final
    await fs.rename(arquivo.path, caminhoFinal);
    
    // Deletar arquivo antigo
    await anexoTarefaService.deletarArquivoFisico(anexoExistente.caminho_arquivo);
    
    // Atualizar registro no banco
    const dadosAtualizacao = {
      nome_arquivo: nomeArquivo,
      nome_original: arquivo.originalname,
      tamanho_arquivo: arquivo.size,
      caminho_arquivo: caminhoFinal
    };
    
    await anexoTarefaService.atualizarAnexoTarefa(Number(id_anexo), dadosAtualizacao);
    
    enviarRespostaSucesso(res, 'Anexo atualizado com sucesso');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao atualizar anexo', error);
  }
}

// Função principal para deletar anexo
export async function deletarAnexo(req: Request, res: Response) {
  try {
    const { id_anexo } = req.params;
    
    if (!id_anexo || isNaN(Number(id_anexo))) {
      return enviarRespostaErro(res, 'ID do anexo inválido', null, 400);
    }
    
    const sucesso = await anexoTarefaService.deletarAnexoTarefa(Number(id_anexo));
    
    if (!sucesso) {
      return enviarErro404(res, 'Anexo não encontrado');
    }
    
    enviarRespostaSucesso(res, 'Anexo removido com sucesso');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar anexo', error);
  }
}

// Função principal para deletar todos os anexos de uma tarefa
export async function deletarTodosAnexosTarefa(req: Request, res: Response) {
  try {
    const { id_tarefa } = req.params;
    
    if (!id_tarefa || isNaN(Number(id_tarefa))) {
      return enviarRespostaErro(res, 'ID da tarefa inválido', null, 400);
    }
    
    await anexoTarefaService.deletarTodosAnexosTarefa(Number(id_tarefa));
    enviarRespostaSucesso(res, 'Todos os anexos da tarefa foram removidos');
  } catch (error) {
    enviarRespostaErro(res, 'Erro ao deletar anexos da tarefa', error);
  }
}