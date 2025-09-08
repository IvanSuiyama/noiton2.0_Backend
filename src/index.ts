
import express from 'express';
import router from './routes';
import { autenticarJWT } from './middlewares/authMiddleware';
import pool from './config/databaseConfig';
import { criarTabelaUsuario } from './models/usuarioModel';
import { apagarTodasTabelas } from './models/dellAll';
import { config } from './config';

const app = express();

console.log('Backend iniciando...');

app.use(express.json());
app.use('/', router);

async function startServer() {
  console.log('Conectando com banco de dados Neon...');
  try {
    await pool.connect();
    console.log('Conexão com banco de dados Neon bem sucedida!');
    console.log('Apagando todas as tabelas existentes...');
    // await apagarTodasTabelas();
    // console.log('Todas as tabelas apagadas com sucesso!');
    console.log('Criando tabelas...');
    await criarTabelaUsuario();
    console.log('Tabela usuarios criada com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ou criar tabela:', error);
    process.exit(1);
  }
  app.listen(config.port, () => {
    console.log(`Backend rodando em: porta ${config.port}`);
  });
}

startServer();
