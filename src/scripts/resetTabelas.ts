import pool from '../config/databaseConfig';
import { criarTabelaUsuario } from '../models/usuarioModel';
import { criarTabelaCategorias } from '../models/categoriaModel';
import { criarTabelaTarefas } from '../models/tarefaModel';
import { criarTabelaWorkspace } from '../models/workspaceModel';
import { criarTabelaTarefaCategoria } from '../models/tarefaCategoriaModel';
import { criarTabelaComentarios } from '../models/comentarioModel';

async function resetDatabase() {
  try {
    console.log('🔄 Conectando com banco de dados...');
    await pool.connect();
    console.log('✅ Conexão estabelecida!');
    
    // Apagar todas as tabelas na ordem correta (devido às dependências)
    console.log('🗑️ Apagando tabelas existentes...');
    
    await pool.query('DROP TABLE IF EXISTS comentarios CASCADE');
    await pool.query('DROP TABLE IF EXISTS tarefa_workspace CASCADE');
    await pool.query('DROP TABLE IF EXISTS usuario_workspace CASCADE');
    await pool.query('DROP TABLE IF EXISTS tarefa_categoria CASCADE');
    await pool.query('DROP TABLE IF EXISTS tarefa_recorrente_categoria CASCADE');
    await pool.query('DROP TABLE IF EXISTS tarefas CASCADE');
    await pool.query('DROP TABLE IF EXISTS workspace CASCADE');
    await pool.query('DROP TABLE IF EXISTS categorias CASCADE');
    await pool.query('DROP TABLE IF EXISTS usuarios CASCADE');
    
    console.log('✅ Tabelas apagadas com sucesso!');
    
    // Recriar todas as tabelas usando os models existentes
    console.log('🔨 Recriando tabelas...');
    
    console.log('📝 Criando tabela usuarios...');
    await criarTabelaUsuario();
    
    console.log('📁 Criando tabela categorias...');
    await criarTabelaCategorias();
    
    console.log('📋 Criando tabela tarefas...');
    await criarTabelaTarefas();
    
    console.log('👥 Criando tabelas de workspace...');
    await criarTabelaWorkspace();
    
    console.log('🔗 Criando tabela tarefa_categoria...');
    await criarTabelaTarefaCategoria();
    
    console.log('💬 Criando tabela comentarios...');
    await criarTabelaComentarios();
    
    console.log('🎉 Todas as tabelas foram recriadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao resetar banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar o reset
resetDatabase();

// Para executar este script, use o comando:
// npx ts-node src/scripts/resetTabelas.ts