import pool from '../config/databaseConfig';
import fs from 'fs/promises';
import path from 'path';

export interface AnexoTarefa {
  id_anexo?: number;
  id_tarefa: number;
  tipo_arquivo: 'pdf' | 'imagem';
  nome_arquivo: string;
  nome_original: string;
  tamanho_arquivo: number;
  caminho_arquivo: string;
  data_upload?: string;
  data_atualizacao?: string;
}

// Função auxiliar para criar diretório de uploads se não existir
export async function criarDiretorioUploads(): Promise<void> {
  const uploadDir = path.join(process.cwd(), 'uploads', 'tarefas');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Função auxiliar para gerar nome único do arquivo
export function gerarNomeArquivo(nomeOriginal: string, idTarefa: number, tipoArquivo: string): string {
  const timestamp = Date.now();
  const extensao = path.extname(nomeOriginal);
  return `tarefa_${idTarefa}_${tipoArquivo}_${timestamp}${extensao}`;
}

// Função auxiliar para validar tipo de arquivo
export function validarTipoArquivo(mimetype: string, tipoArquivo: 'pdf' | 'imagem'): boolean {
  if (tipoArquivo === 'pdf') {
    return mimetype === 'application/pdf';
  }
  
  if (tipoArquivo === 'imagem') {
    const imagensTipos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imagensTipos.includes(mimetype);
  }
  
  return false;
}

// Função auxiliar para inserir anexo no banco
export async function inserirAnexoNoBanco(anexo: AnexoTarefa): Promise<number> {
  const result = await pool.query(
    `INSERT INTO anexos_tarefa (id_tarefa, tipo_arquivo, nome_arquivo, nome_original, tamanho_arquivo, caminho_arquivo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_anexo`,
    [anexo.id_tarefa, anexo.tipo_arquivo, anexo.nome_arquivo, anexo.nome_original, anexo.tamanho_arquivo, anexo.caminho_arquivo]
  );
  return result.rows[0].id_anexo;
}

// Função principal de criação de anexo
export async function criarAnexoTarefa(anexo: AnexoTarefa): Promise<number> {
  await criarDiretorioUploads();
  return await inserirAnexoNoBanco(anexo);
}

// Função auxiliar para buscar anexo por ID
export async function buscarAnexoPorIdNoBanco(id_anexo: number): Promise<AnexoTarefa | null> {
  const result = await pool.query(
    'SELECT * FROM anexos_tarefa WHERE id_anexo = $1',
    [id_anexo]
  );
  return result.rows[0] || null;
}

// Função principal de busca por ID
export async function buscarAnexoPorId(id_anexo: number): Promise<AnexoTarefa | null> {
  return await buscarAnexoPorIdNoBanco(id_anexo);
}

// Função auxiliar para buscar anexos de uma tarefa
export async function buscarAnexosPorTarefaNoBanco(id_tarefa: number): Promise<AnexoTarefa[]> {
  const result = await pool.query(
    'SELECT * FROM anexos_tarefa WHERE id_tarefa = $1 ORDER BY data_upload DESC',
    [id_tarefa]
  );
  return result.rows;
}

// Função principal de busca por tarefa
export async function buscarAnexosPorTarefa(id_tarefa: number): Promise<AnexoTarefa[]> {
  return await buscarAnexosPorTarefaNoBanco(id_tarefa);
}

// Função auxiliar para buscar anexo específico da tarefa por tipo
export async function buscarAnexoPorTarefaETipoNoBanco(id_tarefa: number, tipo_arquivo: string): Promise<AnexoTarefa | null> {
  const result = await pool.query(
    'SELECT * FROM anexos_tarefa WHERE id_tarefa = $1 AND tipo_arquivo = $2',
    [id_tarefa, tipo_arquivo]
  );
  return result.rows[0] || null;
}

// Função principal de busca por tarefa e tipo
export async function buscarAnexoPorTarefaETipo(id_tarefa: number, tipo_arquivo: string): Promise<AnexoTarefa | null> {
  return await buscarAnexoPorTarefaETipoNoBanco(id_tarefa, tipo_arquivo);
}

// Função auxiliar para verificar se tarefa existe
export async function verificarTarefaExiste(id_tarefa: number): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM tarefas WHERE id_tarefa = $1 LIMIT 1',
    [id_tarefa]
  );
  return (result.rowCount ?? 0) > 0;
}

// Função auxiliar para atualizar anexo no banco
export async function atualizarAnexoNoBanco(id_anexo: number, anexo: Partial<AnexoTarefa>): Promise<boolean> {
  const campos = [];
  const valores = [];
  let contador = 1;

  if (anexo.nome_arquivo) {
    campos.push(`nome_arquivo = $${contador}`);
    valores.push(anexo.nome_arquivo);
    contador++;
  }

  if (anexo.nome_original) {
    campos.push(`nome_original = $${contador}`);
    valores.push(anexo.nome_original);
    contador++;
  }

  if (anexo.tamanho_arquivo) {
    campos.push(`tamanho_arquivo = $${contador}`);
    valores.push(anexo.tamanho_arquivo);
    contador++;
  }

  if (anexo.caminho_arquivo) {
    campos.push(`caminho_arquivo = $${contador}`);
    valores.push(anexo.caminho_arquivo);
    contador++;
  }

  if (campos.length === 0) return false;

  campos.push(`data_atualizacao = CURRENT_TIMESTAMP`);
  valores.push(id_anexo);

  const query = `UPDATE anexos_tarefa SET ${campos.join(', ')} WHERE id_anexo = $${contador}`;
  const result = await pool.query(query, valores);
  
  return (result.rowCount ?? 0) > 0;
}

// Função principal de atualização
export async function atualizarAnexoTarefa(id_anexo: number, anexo: Partial<AnexoTarefa>): Promise<boolean> {
  return await atualizarAnexoNoBanco(id_anexo, anexo);
}

// Função auxiliar para deletar arquivo físico
export async function deletarArquivoFisico(caminhoArquivo: string): Promise<void> {
  try {
    await fs.unlink(caminhoArquivo);
  } catch (error) {
    console.warn('Arquivo físico não encontrado ou já removido:', caminhoArquivo);
  }
}

// Função auxiliar para deletar anexo do banco
export async function deletarAnexoDoBanco(id_anexo: number): Promise<AnexoTarefa | null> {
  const anexo = await buscarAnexoPorId(id_anexo);
  if (!anexo) return null;

  await pool.query('DELETE FROM anexos_tarefa WHERE id_anexo = $1', [id_anexo]);
  return anexo;
}

// Função principal de deleção
export async function deletarAnexoTarefa(id_anexo: number): Promise<boolean> {
  const anexo = await deletarAnexoDoBanco(id_anexo);
  if (!anexo) return false;

  // Deletar arquivo físico
  await deletarArquivoFisico(anexo.caminho_arquivo);
  return true;
}

// Função auxiliar para deletar todos os anexos de uma tarefa
export async function deletarTodosAnexosTarefaNoBanco(id_tarefa: number): Promise<AnexoTarefa[]> {
  const anexos = await buscarAnexosPorTarefa(id_tarefa);
  
  if (anexos.length > 0) {
    await pool.query('DELETE FROM anexos_tarefa WHERE id_tarefa = $1', [id_tarefa]);
  }
  
  return anexos;
}

// Função principal para deletar todos os anexos de uma tarefa
export async function deletarTodosAnexosTarefa(id_tarefa: number): Promise<boolean> {
  const anexos = await deletarTodosAnexosTarefaNoBanco(id_tarefa);
  
  // Deletar arquivos físicos
  for (const anexo of anexos) {
    await deletarArquivoFisico(anexo.caminho_arquivo);
  }
  
  return true;
}

// Função auxiliar para verificar se anexo pertence à tarefa
export async function verificarAnexoPertenceATarefa(id_anexo: number, id_tarefa: number): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM anexos_tarefa WHERE id_anexo = $1 AND id_tarefa = $2 LIMIT 1',
    [id_anexo, id_tarefa]
  );
  return (result.rowCount ?? 0) > 0;
}