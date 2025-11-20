
import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';

export interface Usuario {
  id?: number;
  email: string;
  senha: string;
  telefone?: string | null;
  nome: string;
  pontos?: number;
}

// Função auxiliar para validar email
export function validarFormatoEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função auxiliar para criptografar senha
export async function criptografarSenha(senha: string): Promise<string> {
  return await bcrypt.hash(senha, 10);
}

// Função auxiliar para inserir usuário no banco
export async function inserirUsuarioNoBanco(usuario: Usuario, senhaCriptografada: string): Promise<void> {
  await pool.query(
    'INSERT INTO usuarios (email, senha, telefone, nome, pontos) VALUES ($1, $2, $3, $4, $5)',
    [usuario.email, senhaCriptografada, usuario.telefone ?? null, usuario.nome, usuario.pontos ?? 0.0]
  );
}

// Função principal de cadastro (utiliza as auxiliares)
export async function cadastrarUsuario(usuario: Usuario): Promise<void> {
  if (!validarFormatoEmail(usuario.email)) {
    throw new Error('Formato de email inválido');
  }
  
  const senhaCriptografada = await criptografarSenha(usuario.senha);
  await inserirUsuarioNoBanco(usuario, senhaCriptografada);
}

// Função auxiliar para construir query de atualização
export function construirQueryAtualizacao(dados: Partial<Usuario>, emailBusca: string): { query: string, params: any[] } {
  let query = 'UPDATE usuarios SET';
  const params: any[] = [];
  let set = [];
  
  if (dados.senha) {
    set.push('senha = $' + (params.length + 1));
    params.push(dados.senha); // Nota: senha já deve vir criptografada
  }
  if (dados.telefone !== undefined) {
    set.push('telefone = $' + (params.length + 1));
    params.push(dados.telefone);
  }
  if (dados.nome) {
    set.push('nome = $' + (params.length + 1));
    params.push(dados.nome);
  }
  
  query += ' ' + set.join(', ') + ' WHERE email = $' + (params.length + 1);
  params.push(emailBusca);
  
  return { query, params };
}

// Função principal de edição (utiliza as auxiliares)
export async function editarUsuario(email: string, dados: Partial<Usuario>): Promise<void> {
  let dadosProcessados = { ...dados };
  
  // Criptografar senha se fornecida
  if (dados.senha) {
    dadosProcessados.senha = await criptografarSenha(dados.senha);
  }
  
  const { query, params } = construirQueryAtualizacao(dadosProcessados, email);
  
  if (params.length === 1) return; // Nenhum campo para atualizar além do email
  
  await pool.query(query, params);
}

export async function buscarTodosUsuarios(): Promise<Usuario[]> {
  const result = await pool.query('SELECT id_usuario as id, email, telefone, nome, pontos FROM usuarios');
  return result.rows;
}

export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const result = await pool.query('SELECT id_usuario as id, email, telefone, nome, pontos FROM usuarios WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function buscarUsuarioPorTelefone(telefone: string): Promise<Usuario | null> {
  const result = await pool.query('SELECT id_usuario as id, email, telefone, nome, pontos FROM usuarios WHERE telefone = $1', [telefone]);
  return result.rows[0] || null;
}

// Função para buscar pontos de um usuário
export async function buscarPontosUsuario(id_usuario: number): Promise<number> {
  const result = await pool.query('SELECT pontos FROM usuarios WHERE id_usuario = $1', [id_usuario]);
  return result.rows[0]?.pontos || 0.0;
}

// Função para adicionar pontos a um usuário
export async function adicionarPontosUsuario(id_usuario: number, pontosGanhos: number): Promise<void> {
  await pool.query(
    'UPDATE usuarios SET pontos = pontos + $1 WHERE id_usuario = $2',
    [pontosGanhos, id_usuario]
  );
}

// Função para remover pontos de um usuário
export async function removerPontosUsuario(id_usuario: number, pontosRemover: number): Promise<boolean> {
  // Primeiro verifica se o usuário tem pontos suficientes
  const pontosAtuais = await buscarPontosUsuario(id_usuario);
  
  if (pontosAtuais < pontosRemover) {
    return false; // Não tem pontos suficientes
  }
  
  await pool.query(
    'UPDATE usuarios SET pontos = pontos - $1 WHERE id_usuario = $2',
    [pontosRemover, id_usuario]
  );
  
  return true; // Pontos removidos com sucesso
}

// Função para obter pontos de um usuário por email
export async function obterPontosUsuarioPorEmail(email: string): Promise<number> {
  const result = await pool.query('SELECT pontos FROM usuarios WHERE email = $1', [email]);
  return result.rows[0]?.pontos || 0.0;
}

export async function deletarUsuarioPorEmail(email: string): Promise<void> {
  await pool.query('DELETE FROM usuarios WHERE email = $1', [email]);
}
