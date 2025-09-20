
import express from 'express';
import router from './routes';
import pool from './config/databaseConfig';

const app = express();

app.use(express.json());
app.use('/', router);

async function startServer() {
  console.log('Conectando com banco de dados Neon...');
  try {
    await pool.connect();
    console.log('Conexão com banco de dados Neon bem sucedida!');
  } catch (error) {
    console.error('Erro ao conectar com banco de dados:', error);
    process.exit(1);
  }


  // IP Dados Móveis
  // app.listen(3000, '', () => {
  //   console.log(`Backend rodando em: CELULAR:3000`);
  // });

  // Ip Wifi
  app.listen(3000, '', () => {
    console.log(`Backend rodando em: WIFI:3000`);
  });
}

startServer();
