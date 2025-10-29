import pool from '../config/databaseConfig';

export async function criarTabelaAnexosTarefa() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anexos_tarefa (
      id_anexo SERIAL PRIMARY KEY,
      id_tarefa INTEGER NOT NULL REFERENCES tarefas(id_tarefa) ON DELETE CASCADE,
      tipo_arquivo VARCHAR(10) CHECK (tipo_arquivo IN ('pdf', 'imagem')) NOT NULL,
      nome_arquivo VARCHAR(255) NOT NULL,
      nome_original VARCHAR(255) NOT NULL,
      tamanho_arquivo INTEGER NOT NULL,
      caminho_arquivo VARCHAR(500) NOT NULL,
      data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(id_tarefa, tipo_arquivo)
    );
  `);
}