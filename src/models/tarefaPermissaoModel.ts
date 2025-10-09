import pool from '../config/databaseConfig';

export async function criarTabelaTarefaPermissoes() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarefa_permissoes (
      id_permissao SERIAL PRIMARY KEY,
      id_tarefa INTEGER REFERENCES tarefas(id_tarefa) ON DELETE CASCADE,
      id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      nivel_acesso INTEGER CHECK (nivel_acesso IN (0, 1, 2)) NOT NULL DEFAULT 2,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(id_tarefa, id_usuario)
    );

    -- Índices para otimizar consultas
    CREATE INDEX IF NOT EXISTS idx_tarefa_permissoes_tarefa ON tarefa_permissoes(id_tarefa);
    CREATE INDEX IF NOT EXISTS idx_tarefa_permissoes_usuario ON tarefa_permissoes(id_usuario);
  `);
}

export interface TarefaPermissao {
  id_permissao?: number;
  id_tarefa: number;
  id_usuario: number;
  nivel_acesso: 0 | 1 | 2; // 0: criador (ver+editar+apagar), 1: editor (ver+editar), 2: visualizador (ver)
  data_criacao?: Date;
}