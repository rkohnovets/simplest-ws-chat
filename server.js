const { randomInt } = require('crypto');
const express = require('express');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const port = 8080;

let log = console.log;

app.get('/', async (req, res) => {
	fs.createReadStream('./index.html').pipe(res)
});

const server = app.listen(port, () => {
	log(`Server is started on http://localhost:${port}`)
});

const wsServer = new WebSocket.Server({ noServer: true })

server.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket, head, (ws) => {
		wsServer.emit('connection', ws, request)
	});
});

wsServer.on('connection', (ws, req) => {
  // если нужны какие-то заголовки из http запроса, 
  // который инициировал подключение через протокол ws
  //console.log(`connection request headers`, req.headers)

  // присваиваем идентификатор пользователю
  ws.Id = randomInt(1000)
  
  log(`${ws.Id} connected`)
  broadcastMessage(`${ws.Id} connected`)

  ws.on('message', async (dataStr) => {
    try {
      var { type, data } = JSON.parse(dataStr)
      
      if (type != "post_message") {
        ws.send(JSON.stringify({ type: "error", data: "not message" }))
        return
      }

      let message = data

      if (message.length == 0) {
        ws.send(JSON.stringify({ type: "error", data: "empty message" }))
        return
      }

      log(`Received message: '${message}' from user ${ws.Id}`)

      message = `${ws.Id} sent message: ` + message

      broadcastMessage(message);
    } catch (e) {
      log(`error on ws.on('message', handler): `, e)
      try {
        ws.send(JSON.stringify({ type: "error", data: "unexpected error on server" }))
      } catch {

      }
    }
  });

  ws.on('close', function (code, reason) {
    log(`Connection closed, code ${code}`)

    // часто, а мб и всегда, просто пустая строка
    log(`Reason: `, reason.toString())

    broadcastMessage(`${ws.Id} disconnected`)
  });

  ws.on('error', function (error) {
    log(`WebSocket error: ${error.message}`);
  });
});

let broadcastMessage = (message) => {
  wsServer.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      //ws.send(message);
      ws.send(JSON.stringify({ type: "get_message", data: String(message) }))
    }
  });
}

wsServer.on('close', function close() {
  clearInterval(interval);
});

wsServer.on('error', function (error) {
  log(`WebSocket server error: ${error.message}`);
});
