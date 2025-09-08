// Script para criar tabela de usuário e inserir usuário com senha criptografada
import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';

export async function criarTabelaUsuario() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      telefone VARCHAR(20) UNIQUE NOT NULL,
      nome VARCHAR(100) NOT NULL
    );
  `);
}

export async function inserirUsuario(email: string, senha: string, telefone: string, nome: string) {
  const hash = await bcrypt.hash(senha, 10);
  await pool.query(
    'INSERT INTO usuarios (email, senha, telefone, nome) VALUES ($1, $2, $3, $4)',
    [email, hash, telefone, nome]
  );
}
