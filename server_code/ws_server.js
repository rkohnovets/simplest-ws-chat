const { randomInt } = require('crypto')
const WebSocket = require('ws')

let log = console.log;
const wsPort = 8081;
const wsServer = new WebSocket.Server({ port: wsPort })
log(`ws server is started on ws://localhost:${wsPort}`)

wsServer.on('connection', (client_ws) => {
  // присваиваем идентификатор пользователю
  client_ws.Id = randomInt(1000)
  
  const message = `user ${client_ws.Id} connected`
  broadcastMessage(message, 'get_message', client_ws.Id)
  log(message)
  
  const sendErrorMessage = (message) => {
    client_ws.send(JSON.stringify({ type: "error", data: message}))
  }

  const handlePostMessage = (message) => {
    if (message.length == 0) {
      sendErrorMessage("empty message")
      return
    }
    broadcastMessage(`${client_ws.Id} sent message: ${message}`);
  }
  
  client_ws.on('message', async (dataStr) => {
    try {
      log(`Received message: '${dataStr}' from user ${client_ws.Id}`)
      const obj = JSON.parse(dataStr)
      const { type, data } = obj
      
      switch(type) {
        case 'post_message':
          handlePostMessage(data)
          break
        default:
          sendErrorMessage("message type not recognized")
      }
    } catch (e) {
      log(`error handling ws 'message' event`, e)
      sendErrorMessage("unexpected error on server")
    }
  });

  client_ws.on('close', function (code) {
    log(`Connection closed, code ${code}`)
    broadcastMessage(`${client_ws.Id} disconnected`)
  });

  client_ws.on('error', function (error) {
    log(`WebSocket error: ${error?.message ?? error}`);
  });
});

const broadcastMessage = (stringData, type = 'get_message', exceptUserId = null) => {
  wsServer.clients.forEach((client_ws) => {
    if (exceptUserId && client_ws.Id == exceptUserId)
      return
    if (client_ws.readyState !== WebSocket.OPEN)
      return

    const jsonStr = JSON.stringify({ 
      type: type, 
      data: stringData
    })
    client_ws.send(jsonStr)
  });
}

wsServer.on('error', function(error) {
  log(`WebSocket server error: ${error.message}`);
});

wsServer.on('close', function() {
});
