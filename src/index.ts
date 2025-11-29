
import express from 'express';
import router from './routes';
import pool from './config/databaseConfig';

const app = express();

app.use(express.json());
app.use('/', router);

async function startServer() {
  console.log('Conectando com banco de dados ...');
  try {
    // Testa a conexão sem manter a conexão aberta
    const client = await pool.connect();
    console.log('Conexão com banco de dados bem sucedida!');
    client.release(); // Libera a conexão de volta para o pool
  } catch (error) {
    console.error('Erro ao conectar com banco de dados:', error);
    process.exit(1);
  }

 app.listen(3000, '', () => {
  console.log("Backend rodando na porta 3000");
});

}

startServer();
