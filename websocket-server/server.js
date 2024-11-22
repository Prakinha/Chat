const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 420 });

let clients = new Map(); // Mapeia nome do cliente para WebSocket

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.isIdentified = false; // Flag para identificar o cliente

  ws.on('message', (message) => {
    console.log(`Mensagem recebida: ${message}`);

    try {
      const data = JSON.parse(message);

      // Identificação do cliente
      if (!ws.isIdentified) {
        if (data.type === 'device' && data.device) {
          const clientName = data.device;

          // Adiciona o cliente ao Map com o nome como chave
          clients.set(clientName, ws);
          ws.isIdentified = true;
          ws.clientName = clientName;

          console.log(`Cliente identificado como: ${clientName}`);

          // Configura evento para remover cliente ao desconectar
          ws.on('close', () => {
            clients.delete(clientName);
            console.log(`Cliente desconectado: ${clientName}`);
          });
        } else {
          console.error('Erro: Nome do cliente ausente.');
          ws.close(); // Fecha a conexão se não enviar um nome válido
        }
        return; // Interrompe até que o cliente esteja identificado
      }

      // Processamento de solicitações de lista
      if (data.type === 'list_request') {
        // Obter a lista de clientes conectados, excluindo o próprio solicitante
        const clientList = Array.from(clients.keys()).filter(name => name !== ws.clientName);

        // Enviar a lista de clientes para o solicitante
        ws.send(JSON.stringify({ type: 'client_list', clients: clientList }));
        console.log(`Lista de clientes enviada para ${ws.clientName}`);
      }
      else if (data.type === 'card' && data.targetName) {
        const targetName = data.targetName;
        const targetClient = clients.get(targetName);

        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify({ type: 'card', uid: data.uid, from: ws.clientName }));
          console.log(`Mensagem enviada de ${ws.clientName} para ${targetName}: ${data.content}`);
        } else {
          console.error(`Cliente ${targetName} não está conectado.`);
          ws.send(JSON.stringify({ type: 'error', message: `Cliente ${targetName} não está conectado.` }));
        }
      }

      // Processamento de mensagens para clientes identificados
      else if (data.type === 'message' && data.targetName) {
        const targetName = data.targetName;
        const targetClient = clients.get(targetName);

        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify({ type: 'message', content: data.content, from: ws.clientName }));
          console.log(`Mensagem enviada de ${ws.clientName} para ${targetName}: ${data.content}`);
        } else {
          console.error(`Cliente ${targetName} não está conectado.`);
          ws.send(JSON.stringify({ type: 'error', message: `Cliente ${targetName} não está conectado.` }));
        }
      }
    } catch (e) {
      console.error('Erro ao processar a mensagem:', e);
    }
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

console.log('Servidor WebSocket rodando na porta 420');
