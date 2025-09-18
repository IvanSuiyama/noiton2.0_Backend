// Para executar a exclusão de todas as tabelas manualmente, rode:

import pool from '../config/databaseConfig';


// Ordem manual para evitar problemas de permissão e dependências
export async function apagarTodasTabelas() {
  // Tabelas intermediárias (N:N)
  const tabelas = [
    'tarefa_categoria',
    'tarefa_recorrente_categoria',
    // Tabelas filhas
    'tarefas',
    'tarefas_recorrentes',
    // Tabelas pais
    'categorias',
    'usuarios',
    'workspaces'
  ];
  for (const tabela of tabelas) {
    try {
      await pool.query(`DROP TABLE IF EXISTS "${tabela}" CASCADE;`);
      console.log(`Tabela ${tabela} apagada com sucesso!`);
    } catch (err: any) {
      console.error(`Erro ao apagar tabela ${tabela}:`, err?.message || err);
    }
  }
}
