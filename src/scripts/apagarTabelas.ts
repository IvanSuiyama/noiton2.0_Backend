import { apagarTodasTabelas } from '../models/dellAll';
import pool from '../config/databaseConfig';

(async () => {
  try {
    await pool.connect();
    await apagarTodasTabelas();
    console.log('Todas as tabelas foram apagadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao apagar tabelas:', error);
    process.exit(1);
  }
})();

// npx ts-node src/scripts/apagarTabelas.ts
