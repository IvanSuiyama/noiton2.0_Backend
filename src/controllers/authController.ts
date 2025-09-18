import { Request, Response } from 'express';
import { autenticarUsuario } from '../services/authService';

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }
    const token = await autenticarUsuario(email, senha);
    if (!token) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    res.json({ token, email });
}
