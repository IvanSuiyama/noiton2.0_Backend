import { Request, Response } from 'express';
import * as tarefaService from '../services/tarefaService';
import * as categoriaService from '../services/categoriaService';
import * as workspaceService from '../services/workspaceService';
import * as usuarioService from '../services/usuarioService';
import * as comentarioService from '../services/comentarioService';
import * as denunciaService from '../services/denunciaService';
import * as anexoTarefaService from '../services/anexoTarefaService';

export async function processarSyncOffline(req: Request, res: Response) {
  try {
    const operacoes = req.body;

    if (!Array.isArray(operacoes)) {
      return res.status(400).json({
        error: 'Formato inválido',
        message: 'O corpo da requisição precisa ser um array de operações.'
      });
    }

    const resultados: any[] = [];
    const relatorio = {
      total_operacoes: operacoes.length,
      sucessos: 0,
      falhas: 0,
      por_entidade: {} as any
    };

    console.log(`🔄 Iniciando sincronização de ${operacoes.length} operações`);

    for (const op of operacoes) {
      const { op_id, op_type, entity, payload } = op;

      try {
        let resultado;

        console.log(`📝 Processando: ${entity} - ${op_type} (ID: ${op_id})`);

        // ----------------------------------
        // TRATAMENTO DAS ENTIDADES
        // ----------------------------------
        switch (entity) {
          case 'usuario':
          case 'user':
            resultado = await processarOperacaoUsuario(op_type, payload);
            break;

          case 'tarefa':
          case 'task':
            resultado = await processarOperacaoTarefa(op_type, payload);
            break;

          case 'categoria':
          case 'category':
            resultado = await processarOperacaoCategoria(op_type, payload);
            break;

          case 'workspace':
            resultado = await processarOperacaoWorkspace(op_type, payload);
            break;

          case 'comentario':
          case 'comment':
            resultado = await processarOperacaoComentario(op_type, payload);
            break;

          case 'denuncia':
          case 'report':
            resultado = await processarOperacaoDenuncia(op_type, payload);
            break;

          case 'anexo':
          case 'attachment':
            resultado = await processarOperacaoAnexo(op_type, payload);
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
          error: err.message
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
      resultados
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
// PROCESSADORES DE ENTIDADES
// ----------------------------------------------------------------------------

async function processarOperacaoUsuario(op_type: string, data: any) {
  switch (op_type) {
    case 'CREATE':
      await usuarioService.cadastrarUsuario(data);
      return { message: 'Usuário criado com sucesso', id: data.id_usuario };

    case 'UPDATE':
      // Para updates, precisaríamos implementar um método de atualização no usuarioService
      throw new Error('Operação UPDATE para usuário não implementada ainda');

    case 'DELETE':
      // Para deletes, precisaríamos implementar um método de deleção no usuarioService
      throw new Error('Operação DELETE para usuário não implementada ainda');

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoTarefa(op_type: string, data: any) {
  switch (op_type) {
    case 'CREATE':
      // Usar o método criarTarefa existente
      const id_tarefa = await tarefaService.criarTarefa(data, data.id_workspace, data.id_usuario);
      return { message: 'Tarefa criada com sucesso', id_tarefa };

    case 'UPDATE':
      await tarefaService.atualizarTarefa(data.id_tarefa, data);
      return { message: 'Tarefa atualizada com sucesso', id_tarefa: data.id_tarefa };

    case 'DELETE':
      const deletada = await tarefaService.deletarTarefaPorId(data.id_tarefa, data.id_usuario_logado);
      return { message: 'Tarefa deletada com sucesso', deletada };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoCategoria(op_type: string, data: any) {
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

async function processarOperacaoWorkspace(op_type: string, data: any) {
  switch (op_type) {
    case 'CREATE':
      await workspaceService.criarWorkspace(data);
      return { message: 'Workspace criado com sucesso', nome: data.nome };

    case 'UPDATE':
      await workspaceService.atualizarWorkspace(data.nome, data);
      return { message: 'Workspace atualizado com sucesso', nome: data.nome };

    case 'DELETE':
      const deletado = await workspaceService.deletarWorkspaceSeCriador(data.id_workspace, data.email_criador);
      return { message: 'Workspace deletado com sucesso', id_workspace: data.id_workspace, deletado };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoComentario(op_type: string, data: any) {
  switch (op_type) {
    case 'CREATE':
      await comentarioService.criarComentario(data);
      return { message: 'Comentário criado com sucesso', id_tarefa: data.id_tarefa };

    case 'UPDATE':
      await comentarioService.editarComentario(data.id_comentario, data.descricao);
      return { message: 'Comentário atualizado com sucesso', id_comentario: data.id_comentario };

    case 'DELETE':
      const deletado = await comentarioService.deletarComentario(data.id_comentario, data.email);
      return { message: 'Comentário deletado com sucesso', id_comentario: data.id_comentario, deletado };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoDenuncia(op_type: string, data: any) {
  switch (op_type) {
    case 'CREATE':
      const denuncia = await denunciaService.criarDenuncia(data);
      return { message: 'Denúncia criada com sucesso', denuncia };

    case 'UPDATE':
      // Assumindo que existe um método de edição
      throw new Error('Operação UPDATE para denúncia não implementada ainda');

    case 'DELETE':
      // Assumindo que existe um método de deleção
      throw new Error('Operação DELETE para denúncia não implementada ainda');

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}

async function processarOperacaoAnexo(op_type: string, data: any) {
  switch (op_type) {
    case 'CREATE':
      const anexo = await anexoTarefaService.criarAnexoTarefa(data);
      return { message: 'Anexo criado com sucesso', anexo };

    case 'UPDATE':
      // Para updates, precisaríamos implementar um método de atualização
      throw new Error('Operação UPDATE para anexo não implementada ainda');

    case 'DELETE':
      await anexoTarefaService.deletarAnexoTarefa(data.id_anexo);
      return { message: 'Anexo deletado com sucesso', id_anexo: data.id_anexo };

    default:
      throw new Error('Operação inválida: ' + op_type);
  }
}
