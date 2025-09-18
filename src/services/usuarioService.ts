
import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';

export interface Usuario {
  id?: number;
  email: string;
  senha: string;
  telefone?: string | null;
  nome: string;
}

export async function cadastrarUsuario(usuario: Usuario): Promise<void> {
  const hash = await bcrypt.hash(usuario.senha, 10);
  await pool.query(
    'INSERT INTO usuarios (email, senha, telefone, nome) VALUES ($1, $2, $3, $4)',
    [usuario.email, hash, usuario.telefone ?? null, usuario.nome]
  );
}

export async function editarUsuario(email: string, dados: Partial<Usuario>): Promise<void> {
  let query = 'UPDATE usuarios SET';
  const params: any[] = [];
  let set = [];
  if (dados.senha) {
    const hash = await bcrypt.hash(dados.senha, 10);
    set.push('senha = $' + (params.length + 1));
    params.push(hash);
  }
  if (dados.telefone !== undefined) {
    set.push('telefone = $' + (params.length + 1));
    params.push(dados.telefone);
  }
  if (dados.nome) {
    set.push('nome = $' + (params.length + 1));
    params.push(dados.nome);
  }
  if (set.length === 0) return;
  query += ' ' + set.join(', ') + ' WHERE email = $' + (params.length + 1);
  params.push(email);
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
