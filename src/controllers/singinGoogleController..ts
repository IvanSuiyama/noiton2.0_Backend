import { Request, Response } from "express";
import { gerarTokenJWT, buscarUsuarioParaAutenticacao } from "../services/authService";

export async function loginGoogle(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    const usuario = await buscarUsuarioParaAutenticacao(email);

    // Aqui o email SEMPRE deve existir (app verifica antes)
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const token = gerarTokenJWT({
      id_usuario: usuario.id_usuario,
      email: usuario.email
    });

    return res.json({
      token,
      id_usuario: usuario.id_usuario,
      email: usuario.email
    });

  } catch (error) {
    console.error("Erro login-google:", error);
    return res.status(500).json({ error: "Erro interno no login Google" });
  }
}
