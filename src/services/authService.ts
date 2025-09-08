import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta';

export async function autenticarUsuario(email: string, senha: string): Promise<string | null> {
  const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  const usuario = result.rows[0];
  if (!usuario) return null;
  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) return null;
  const token = jwt.sign({ email: usuario.email, id: usuario.id }, JWT_SECRET, { expiresIn: '1h' });
  return token;
}

export function verificarToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
