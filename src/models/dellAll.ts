import pool from '../config/databaseConfig';

export async function apagarTodasTabelas() {
  const resultado = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  `);
  const tabelas: string[] = resultado.rows.map(row => row.tablename);

  await pool.query('SET session_replication_role = replica;');


  for (const tabela of tabelas) {
    await pool.query(`DROP TABLE IF EXISTS "${tabela}" CASCADE;`);
    console.log(`Tabela ${tabela} apagada com sucesso!`);
  }

  await pool.query('SET session_replication_role = DEFAULT;');
}
