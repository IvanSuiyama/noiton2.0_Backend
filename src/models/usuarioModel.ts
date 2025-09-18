// Script para criar tabela de usuário e inserir usuário com senha criptografada
import pool from '../config/databaseConfig';
import bcrypt from 'bcrypt';


export async function criarTabelaUsuario() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      telefone VARCHAR(20) UNIQUE,
      nome VARCHAR(100) NOT NULL
    );
  `);
}


