import { Request, Response, NextFunction } from 'express';

// Token fixo para administrador (você pode alterar este valor)
const ADMIN_TOKEN = '';

// Interface para adicionar informações do admin ao request
declare global {
  namespace Express {
    interface Request {
      admin?: {
        isAdmin: boolean;
        token: string;
      };
    }
  }
}

// Middleware de autenticação específico para administrador
export function autenticarAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token de administrador não fornecido',
        message: 'Use: Authorization: Bearer ADMIN_TOKEN' 
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (token !== ADMIN_TOKEN) {
      return res.status(403).json({ 
        error: 'Token de administrador inválido',
        message: 'Acesso negado. Token administrativo necessário.' 
      });
    }

    // Adicionar informações do admin ao request
    req.admin = {
      isAdmin: true,
      token: token
    };

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Erro interno de autenticação',
      details: error
    });
  }
}

// Middleware para verificar se é admin (pode ser usado em rotas que precisam de admin OU usuário normal)
export function verificarAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (token === ADMIN_TOKEN) {
      req.admin = {
        isAdmin: true,
        token: token
      };
    }
  }

  next();
}

export { ADMIN_TOKEN };