import { Request, Response } from 'express';
import * as tarefaService from '../services/tarefaService';
import * as categoriaService from '../services/categoriaService';
import * as workspaceService from '../services/workspaceService';
import * as usuarioService from '../services/usuarioService';
import * as comentarioService from '../services/comentarioService';
import * as anexoTarefaService from '../services/anexoTarefaService';

export async function processarSyncOffline(req: Request, res: Response) {
  try {
    const { operacoes, last_sync, user_email } = req.body;

    if (!Array.isArray(operacoes)) {
      return res.status(400).json({
        error: 'Formato inválido',
        message: 'O corpo da requisição precisa ser um array de operações.'
      });
    }

    // Verificar se usuário existe/está ativo
    if (user_email) {
      try {
        const usuario = await usuarioService.buscarUsuarioPorEmail(user_email);
        if (!usuario) {
          return res.status(401).json({
            error: 'Usuário não encontrado',
            message: 'Não foi possível sincronizar: usuário não existe.'
          });
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      }
    }

    const resultados: any[] = [];
    const relatorio = {
      total_operacoes: operacoes.length,
      sucessos: 0,
      falhas: 0,
      por_entidade: {} as any
    };

    console.log(`🔄 Iniciando sincronização de ${operacoes.length} operações para: ${user_email}`);

    for (const op of operacoes) {
      const { op_id, op_type, entity, payload, timestamp } = op;

      try {
        let resultado;

        console.log(`📝 Processando: ${entity} - ${op_type} (ID: ${op_id})`);

        // Verificar se a operação é muito antiga (evitar conflitos)
        if (timestamp && last_sync) {
          const opTime = new Date(timestamp).getTime();
          const lastSyncTime = new Date(last_sync).getTime();
          
          if (opTime < lastSyncTime) {
            console.log(`⏰ Operação ignorada (muito antiga): ${entity} - ${op_type}`);
            resultados.push({
              op_id,
              success: true,
              skipped: true,
              reason: 'operation_too_old'
            });
            continue;
          }
        }

        switch (entity) {
          case 'usuario':
          case 'user':
            resultado = await processarOperacaoUsuario(op_type, payload, user_email);
            break;

          case 'tarefa':
          case 'task':
            resultado = await processarOperacaoTarefa(op_type, payload, user_email);
            break;

          case 'categoria':
          case 'category':
            resultado = await processarOperacaoCategoria(op_type, payload, user_email);
            break;

          case 'workspace':
            resultado = await processarOperacaoWorkspace(op_type, payload, user_email);
            break;

          case 'comentario':
          case 'comment':
            resultado = await processarOperacaoComentario(op_type, payload, user_email);
            break;

          case 'anexo':
          case 'attachment':
            resultado = await processarOperacaoAnexo(op_type, payload, user_email);
            break;

          default:
            throw new Error(`Entidade não reconhecida: ${entity}`);
        }

        resultados.push({
          op_id,
          success: true,
          result: resultado
        });

        relatorio.sucessos++;
        if (!relatorio.por_entidade[entity]) {
          relatorio.por_entidade[entity] = { sucessos: 0, falhas: 0 };
        }
        relatorio.por_entidade[entity].sucessos++;

        console.log(`✅ Sucesso: ${entity} - ${op_type} (ID: ${op_id})`);

      } catch (err: any) {
        resultados.push({
          op_id,
          success: false,
          error: err.message,
          entity,
          op_type
        });

        relatorio.falhas++;
        if (!relatorio.por_entidade[entity]) {
          relatorio.por_entidade[entity] = { sucessos: 0, falhas: 0 };
        }
        relatorio.por_entidade[entity].falhas++;

        console.error(`❌ Erro: ${entity} - ${op_type} (ID: ${op_id}):`, err.message);
      }
    }

    console.log(`🏁 Sincronização concluída: ${relatorio.sucessos} sucessos, ${relatorio.falhas} falhas`);

    res.json({
      message: 'Sincronização processada',
      relatorio,
      resultados,
      server_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no sync offline:', error);
    return res.status(500).json({
      error: 'Erro interno',
      message: 'Falha ao processar operações offline.'
    });
  }
}

// ----------------------------------------------------------------------------
// PROCESSADORES DE ENTIDADES ATUALIZADOS
// ----------------------------------------------------------------------------

async function processarOperacaoUsuario(op_type: string, data: any, user_email: string) {
  switch (op_type) {
    case 'CREATE':
      // Verificar se usuário já existe
      const usuarioExistente = await usuarioService.buscarUsuarioPorEmail(data.email);
      if (usuarioExistente) {
        return { 
          message: 'Usuário já existe', 
          email: usuarioExistente.email,
          skipped: true 
        };
      }
      await usuarioService.cadastrarUsuario(data);
      return { message: 'Usuário criado com sucesso', email: data.email };

    case 'UPDATE':
    case 'DELETE':
      throw new Error('Operações UPDATE e DELETE para usuário não são suportadas');

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoTarefa(op_type: string, data: any, user_email: string) {
  switch (op_type) {
    case 'CREATE':
      const id_tarefa = await tarefaService.criarTarefa(data, data.id_workspace, data.id_usuario);
      return { message: 'Tarefa criada com sucesso', id_tarefa };

    case 'UPDATE':
      await tarefaService.atualizarTarefa(data.id_tarefa, data);
      return { message: 'Tarefa atualizada com sucesso', id_tarefa: data.id_tarefa };

    case 'DELETE':
      // Buscar ID do usuário pelo email
      const usuario = await usuarioService.buscarUsuarioPorEmail(user_email);
      if (!usuario || !usuario.id) {
        throw new Error('Usuário não encontrado');
      }
      const deletada = await tarefaService.deletarTarefaPorId(data.id_tarefa, usuario.id);
      return { message: 'Tarefa deletada com sucesso', deletada };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoCategoria(op_type: string, data: any, user_email: string) {
  switch (op_type) {
    case 'CREATE':
      await categoriaService.criarCategoria(data.nome, data.id_workspace);
      return { message: 'Categoria criada com sucesso', nome: data.nome, id_workspace: data.id_workspace };

    case 'UPDATE':
      await categoriaService.atualizarCategoria(data.id_categoria, data.nome, data.id_workspace);
      return { message: 'Categoria atualizada com sucesso', id_categoria: data.id_categoria };

    case 'DELETE':
      const deletada = await categoriaService.deletarCategoria(data.id_categoria, data.id_workspace);
      return { message: 'Categoria deletada com sucesso', id_categoria: data.id_categoria, deletada };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoWorkspace(op_type: string, data: any, user_email: string) {
  // Para DELETE, verificar se é o criador
  if (op_type === 'DELETE' && data.criador !== user_email) {
    throw new Error('Apenas o criador pode deletar o workspace');
  }

  switch (op_type) {
    case 'CREATE':
      await workspaceService.criarWorkspace(data);
      return { message: 'Workspace criado com sucesso', nome: data.nome };

    case 'UPDATE':
      // Verificar se é o criador para updates
      if (data.criador !== user_email) {
        throw new Error('Apenas o criador pode atualizar o workspace');
      }
      await workspaceService.atualizarWorkspacePorId(data.id_workspace, data);
      return { message: 'Workspace atualizado com sucesso', nome: data.nome };

    case 'DELETE':
      const deletado = await workspaceService.deletarWorkspaceSeCriador(data.id_workspace, user_email);
      return { message: 'Workspace deletado com sucesso', id_workspace: data.id_workspace, deletado };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoComentario(op_type: string, data: any, user_email: string) {
  // Verificar se o comentário pertence ao usuário
  if (op_type !== 'CREATE' && data.email !== user_email) {
    throw new Error('Apenas o autor pode modificar o comentário');
  }

  switch (op_type) {
    case 'CREATE':
      await comentarioService.criarComentario(data);
      return { message: 'Comentário criado com sucesso', id_tarefa: data.id_tarefa };

    case 'UPDATE':
      await comentarioService.editarComentario(data.id_comentario, data.descricao);
      return { message: 'Comentário atualizado com sucesso', id_comentario: data.id_comentario };

    case 'DELETE':
      const deletado = await comentarioService.deletarComentario(data.id_comentario, user_email);
      return { message: 'Comentário deletado com sucesso', id_comentario: data.id_comentario, deletado };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoAnexo(op_type: string, data: any, user_email: string) {
  switch (op_type) {
    case 'CREATE':
      const anexo = await anexoTarefaService.criarAnexoTarefa(data);
      return { message: 'Anexo criado com sucesso', anexo };

    case 'DELETE':
      await anexoTarefaService.deletarAnexoTarefa(data.id_anexo);
      return { message: 'Anexo deletado com sucesso', id_anexo: data.id_anexo };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

// Processador para relacionamentos usando functions existentes nos services
async function processarRelacionamento(op_type: string, entity: string, data: any, user_email: string) {
  switch (entity) {
    case 'usuario_workspace':
      if (op_type === 'CREATE') {
        await workspaceService.adicionarEmailNoWorkspace(data.email, data.id_workspace);
        return { message: 'Usuário adicionado ao workspace', email: data.email, id_workspace: data.id_workspace };
      } else if (op_type === 'DELETE') {
        await workspaceService.removerEmailNoWorkspace(data.email, data.id_workspace);
        return { message: 'Usuário removido do workspace', email: data.email, id_workspace: data.id_workspace };
      }
      break;

    case 'tarefa_workspace':
      if (op_type === 'CREATE') {
        await tarefaService.associarTarefaAWorkspace(data.id_tarefa, data.id_workspace);
        return { message: 'Tarefa associada ao workspace', id_tarefa: data.id_tarefa, id_workspace: data.id_workspace };
      } else if (op_type === 'DELETE') {
        await tarefaService.removerTarefaDeWorkspace(data.id_tarefa, data.id_workspace);
        return { message: 'Tarefa removida do workspace', id_tarefa: data.id_tarefa, id_workspace: data.id_workspace };
      }
      break;

    case 'tarefa_categoria':
      if (op_type === 'CREATE') {
        await tarefaService.associarCategoriasATarefa(data.id_tarefa, [data.id_categoria]);
        return { message: 'Categoria associada à tarefa', id_tarefa: data.id_tarefa, id_categoria: data.id_categoria };
      } else if (op_type === 'DELETE') {
        await tarefaService.removerCategoriaDaTarefa(data.id_tarefa, data.id_categoria);
        return { message: 'Categoria removida da tarefa', id_tarefa: data.id_tarefa, id_categoria: data.id_categoria };
      }
      break;

    default:
      throw new Error(`Relacionamento não suportado: ${entity}`);
  }
  
  throw new Error(`Operação ${op_type} não suportada para ${entity}`);
}

// Nova função para obter dados completos para sincronização inicial
export async function obterDadosParaSync(req: Request, res: Response) {
  try {
    const { user_email } = req.params;
    
    if (!user_email) {
      return res.status(400).json({
        error: 'Email obrigatório',
        message: 'Email do usuário é necessário para sincronização.'
      });
    }

    console.log(`🔄 Obtendo dados para sync do usuário: ${user_email}`);

    // Buscar todos os dados relacionados ao usuário
    const workspaces = await workspaceService.buscarWorkspacesPorEmail(user_email);
    
    // Buscar categorias dos workspaces do usuário
    let categorias: any[] = [];
    for (const workspace of workspaces) {
      if (workspace.id_workspace) {
        const cats = await categoriaService.buscarTodasCategoriasPorWorkspace(workspace.id_workspace);
        categorias = categorias.concat(cats);
      }
    }
    
    // Buscar tarefas dos workspaces do usuário
    let tarefas: any[] = [];
    for (const workspace of workspaces) {
      if (workspace.id_workspace) {
        const tasks = await tarefaService.buscarTarefasPorWorkspace(workspace.id_workspace);
        tarefas = tarefas.concat(tasks);
      }
    }
    
    // Buscar comentários das tarefas
    let comentarios: any[] = [];
    for (const tarefa of tarefas) {
      if (tarefa.id_tarefa) {
        const comments = await comentarioService.buscarComentariosPorTarefa(tarefa.id_tarefa);
        comentarios = comentarios.concat(comments);
      }
    }

    // Buscar anexos das tarefas
    let anexos: any[] = [];
    for (const tarefa of tarefas) {
      if (tarefa.id_tarefa) {
        const attachments = await anexoTarefaService.buscarAnexosPorTarefa(tarefa.id_tarefa);
        anexos = anexos.concat(attachments);
      }
    }

    res.json({
      user_email,
      workspaces,
      categorias,
      tarefas,
      comentarios,
      anexos,
      sync_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao obter dados para sync:', error);
    return res.status(500).json({
      error: 'Erro interno',
      message: 'Falha ao obter dados para sincronização.'
    });
  }
}