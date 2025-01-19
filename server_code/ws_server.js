const { randomInt } = require('crypto')
const WebSocket = require('ws')

let log = console.log;

const wsPort = 8081;
const wsServer = new WebSocket.Server({ port: wsPort })

wsServer.on('connection', (client_ws) => {
  // присваиваем идентификатор пользователю
  client_ws.Id = randomInt(1000)
  
  log(`user ${client_ws.Id} connected`)
  broadcastMessage(`user ${client_ws.Id} connected`)

  const handlePostMessage = (message) => {
    if (message.length == 0) {
      client_ws.send(JSON.stringify({ type: "error", data: "empty message" }))
      return
    }
    log(`Received message: '${message}' from user ${client_ws.Id}`)
    broadcastMessage(`${client_ws.Id} sent message: ${message}`);
  }

  client_ws.on('message', async (dataStr) => {
    try {
      var { type, data } = JSON.parse(dataStr)

      switch(type) {
        case 'post_message':
          handlePostMessage(data)
          break
        default:
          client_ws.send(JSON.stringify({ type: "error", data: "message type not recognized" }))
      }
    } catch (e) {
      log(`error handling ws 'message' event`, e)
      try {
        client_ws.send(JSON.stringify({ type: "error", data: "unexpected error on server" }))
      } catch {}
    }
  });

  client_ws.on('close', function (code, reason) {
    log(`Connection closed, code ${code}`)

    // часто, а мб и всегда, просто пустая строка
    log(`Reason: `, reason.toString())

    broadcastMessage(`${client_ws.Id} disconnected`)
  });

  client_ws.on('error', function (error) {
    log(`WebSocket error: ${error.message}`);
  });
});

const broadcastMessage = (message, type = 'get_message', exceptUserId = null) => {
  wsServer.clients.forEach((client_ws) => {
    if (exceptUserId && client_ws.Id == exceptUserId)
      return
    if (client_ws.readyState !== WebSocket.OPEN)
      return

    const jsonStr = JSON.stringify({ 
      type: type, 
      data: String(message) 
    })
    client_ws.send(jsonStr)
  });
}

wsServer.on('close', function() {
  clearInterval(interval);
});

wsServer.on('error', function(error) {
  log(`WebSocket server error: ${error.message}`);
});
