const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 420 });

let esp32Clients = new Set(); // Conjunto para armazenar clientes ESP32
let frontendClients = new Set(); // Conjunto para armazenar clientes front-end

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.isIdentified = false; // Adicionamos uma propriedade para verificar se o cliente já foi identificado

  ws.on('message', (message) => {
    console.log(`Mensagem recebida do cliente: ${message}`);

    // Se o cliente ainda não foi identificado, tente identificá-lo
    if (!ws.isIdentified) {
      try {
        const data = JSON.parse(message);
        if (data.type === 'device') {
          ws.isIdentified = true;
          if (data.device === 'esp32') {
            esp32Clients.add(ws);
            console.log('Cliente identificado como ESP32');

            // Enviar mensagens periódicas apenas para o ESP32
            const interval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                // ws.send(JSON.stringify({ type: 'ping', message: 'Mensagem periódica do servidor' }));
              }
            }, 5000);

            ws.on('close', () => {
              clearInterval(interval);
              esp32Clients.delete(ws);
              console.log('ESP32 desconectado');
            });
          } else if (data.device === 'frontend') {
            frontendClients.add(ws);
            console.log('Cliente identificado como Front-end');
          }
        }
      } catch (e) {
        console.error('Erro ao identificar o cliente:', e);
        // Opcionalmente, você pode fechar a conexão se a identificação falhar
        ws.close();
      }
      return; // Não processar mais até que o cliente seja identificado
    }

    // Processar mensagens após identificação
    try {
      const data = JSON.parse(message);

      if (data.type === 'card' && esp32Clients.has(ws)) {
        const uid = data.uid;
        console.log(`UID do cartão recebido: ${uid}`);

        // Encaminhar o UID para todos os clientes front-end
        frontendClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'card', uid }));
          }
        });
      }
    } catch (e) {
      console.error('Erro ao processar a mensagem:', e);
    }
  });

  ws.on('close', () => {
    if (esp32Clients.has(ws)) {
      esp32Clients.delete(ws);
      console.log('ESP32 desconectado');
    }
    if (frontendClients.has(ws)) {
      frontendClients.delete(ws);
      console.log('Cliente Front-end desconectado');
    }
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

console.log('Servidor WebSocket rodando na porta 420');
