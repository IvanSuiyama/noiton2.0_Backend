import { Request, Response } from "express";
import { buscarUsuarioParaAutenticacao } from "../services/authService";

export async function verificarEmail(req: Request, res: Response) {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    const usuario = await buscarUsuarioParaAutenticacao(email);

    if (usuario) {
      return res.json({
        exists: true,
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email
      });
    }

    return res.json({
      exists: false
    });

  } catch (error) {
    console.error("Erro verificar email:", error);
    return res.status(500).json({ error: "Erro interno ao verificar email" });
  }
}
