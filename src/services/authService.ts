import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta';

// Função auxiliar para buscar usuário por email
export async function buscarUsuarioParaAutenticacao(email: string): Promise<any | null> {
  const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return result.rows[0] || null;
}

// Função auxiliar para validar senha
export async function validarSenhaUsuario(senhaFornecida: string, senhaHash: string): Promise<boolean> {
  return await bcrypt.compare(senhaFornecida, senhaHash);
}

// Função auxiliar para gerar token JWT
export function gerarTokenJWT(dadosUsuario: { email: string, id: number }): string {
  return jwt.sign(dadosUsuario, JWT_SECRET, { expiresIn: '1h' });
}

// Função principal de autenticação
export async function autenticarUsuario(email: string, senha: string): Promise<string | null> {
  const usuario = await buscarUsuarioParaAutenticacao(email);
  if (!usuario) return null;
  
  const senhaValida = await validarSenhaUsuario(senha, usuario.senha);
  if (!senhaValida) return null;
  
  const token = gerarTokenJWT({ email: usuario.email, id: usuario.id });
  return token;
}

// Função auxiliar para verificar token JWT
export function verificarTokenJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Função principal de verificação
export function verificarToken(token: string): any {
  return verificarTokenJWT(token);
}
