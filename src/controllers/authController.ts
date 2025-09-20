import { Request, Response } from 'express';
import { autenticarUsuario } from '../services/authService';

// Reutilizando as funções auxiliares do usuarioController
import {
  enviarRespostaErro,
  enviarDadosJSON
} from './usuarioController';

// Função auxiliar para validar dados de login
export function validarDadosLogin(email: string, senha: string): boolean {
  return !!(email && senha);
}

// Função auxiliar para enviar erro de credenciais obrigatórias
export function enviarErroCamposObrigatorios(res: Response): void {
  res.status(400).json({ error: 'Email e senha são obrigatórios.' });
}

// Função auxiliar para enviar erro de credenciais inválidas
export function enviarErroCredenciaisInvalidas(res: Response): void {
  res.status(401).json({ error: 'Credenciais inválidas.' });
}

// Função auxiliar para enviar dados de login com sucesso
export function enviarDadosLoginSucesso(res: Response, token: string, email: string): void {
  enviarDadosJSON(res, { token, email });
}

// Função auxiliar para extrair credenciais do request
export function extrairCredenciais(req: Request): { email: string, senha: string } {
  const { email, senha } = req.body;
  return { email, senha };
}

// Função principal de login
export async function login(req: Request, res: Response) {
  const { email, senha } = extrairCredenciais(req);
  
  if (!validarDadosLogin(email, senha)) {
    return enviarErroCamposObrigatorios(res);
  }
  
  const token = await autenticarUsuario(email, senha);
  if (!token) {
    return enviarErroCredenciaisInvalidas(res);
  }
  
  enviarDadosLoginSucesso(res, token, email);
}
