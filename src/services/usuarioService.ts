
import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';

export interface Usuario {
  id?: number;
  email: string;
  senha: string;
  telefone?: string | null;
  nome: string;
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
    'INSERT INTO usuarios (email, senha, telefone, nome) VALUES ($1, $2, $3, $4)',
    [usuario.email, senhaCriptografada, usuario.telefone ?? null, usuario.nome]
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
  const result = await pool.query('SELECT id_usuario as id, email, telefone, nome FROM usuarios');
  return result.rows;
}

export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const result = await pool.query('SELECT id_usuario as id, email, telefone, nome FROM usuarios WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function buscarUsuarioPorTelefone(telefone: string): Promise<Usuario | null> {
  const result = await pool.query('SELECT id_usuario as id, email, telefone, nome FROM usuarios WHERE telefone = $1', [telefone]);
  return result.rows[0] || null;
}

export async function deletarUsuarioPorEmail(email: string): Promise<void> {
  await pool.query('DELETE FROM usuarios WHERE email = $1', [email]);
}
