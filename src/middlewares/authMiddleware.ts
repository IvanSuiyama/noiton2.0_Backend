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
  try {
    const authHeader = req.headers.authorization;
    
    // Verifica se o header Authorization existe
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token não fornecido.',
        message: 'Header Authorization é obrigatório.' 
      });
    }

    // Verifica se o formato está correto (Bearer token)
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Formato de token inválido.',
        message: 'Use o formato: Bearer <token>' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifica se o token não está vazio
    if (!token) {
      return res.status(401).json({ 
        error: 'Token vazio.',
        message: 'Token não pode estar vazio.' 
      });
    }

    // Verifica e decodifica o token
    const payload = verificarToken(token);
    if (!payload) {
      return res.status(401).json({ 
        error: 'Token inválido ou expirado.',
        message: 'Faça login novamente.' 
      });
    }

    // Adiciona os dados do usuário na requisição
    req.user = payload;
    next();
    
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor.',
      message: 'Erro ao processar token.' 
    });
  }
}
