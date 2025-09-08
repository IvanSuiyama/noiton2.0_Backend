import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function autenticarJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verificarToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
  req.user = payload;
  next();
}
