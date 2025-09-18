
import express from 'express';
import router from './routes';
import pool from './config/databaseConfig';
import { criarTabelaUsuario } from './models/usuarioModel';
import { criarTabelaCategorias } from './models/categoriaModel';
import { criarTabelaTarefas } from './models/tarefaModel';
import { criarTabelaTarefasRecorrentes } from './models/tarefaRecorrenteModel';
import { criarTabelaWorkspace } from './models/workspaceModel';
import { config } from './config';

const app = express();

app.use(express.json());
app.use('/', router);

async function startServer() {
  console.log('Conectando com banco de dados Neon...');
  try {
    await pool.connect();
    console.log('Conexão com banco de dados Neon bem sucedida!');
  //     // Ordem correta de criação das tabelas:
  //     console.log('Criando tabela usuarios...');
  //     await criarTabelaUsuario();
  //     console.log('Criando tabela categorias...');
  //     await criarTabelaCategorias();
  //     console.log('Criando tabela tarefas...');
  //     await criarTabelaTarefas();
  //     console.log('Criando tabela tarefas recorrentes...');
  //     await criarTabelaTarefasRecorrentes();
  //     console.log('Criando tabelas de workspace...');
  //     await criarTabelaWorkspace();
  //     console.log('Todas as tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ou criar tabela:', error);
    process.exit(1);
  }
  app.listen(config.port, () => {
    console.log(`Backend rodando em: porta ${config.port}`);
  });
}

startServer();
