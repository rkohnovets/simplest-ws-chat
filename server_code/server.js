const { randomInt } = require('crypto')
const fs = require('fs')
const path = require('path')

const express = require('express')
const WebSocket = require('ws')

let log = console.log;

const app = express();
const port = 8080;

// раздача файлов приложения
const filesToHost = [
  {
    url: '/',
    filepath: './public_files/index.html'
  },
  {
    url: '/client_script.js',
    filepath: './public_files/client_script.js'
  },
]
for (let obj of filesToHost) {
  app.get(obj.url, async (req, res) => {
    // устанавливаем заголовок с типом передаваемых данных
    const ext = path.extname(obj.filepath);
    const mimeType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
    }[ext];
    res.setHeader('Content-Type', mimeType);
    // передаём сам файл
    fs.createReadStream(obj.filepath).pipe(res)
  });
}

// http сервер, раздающий файлы 
// и принимающий запросы на переход на WebSocket
const server = app.listen(port, () => {
	log(`Server is started on http://localhost:${port}`)
});

const wsServer = new WebSocket.Server({ noServer: true })

server.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket, head, (ws) => {
		wsServer.emit('connection', ws, request)
	});
});

wsServer.on('connection', (client_ws, req) => {
  // если нужны какие-то заголовки из http запроса, 
  // который инициировал подключение через протокол ws
  //console.log(`connection request headers`, req.headers)

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
  wsServer.clients.forEach((ws) => {
    if (exceptUserId && ws.Id == exceptUserId)
      return
    if (ws.readyState !== WebSocket.OPEN)
      return

    const jsonStr = JSON.stringify({ 
      type: type, 
      data: String(message) 
    })
    ws.send(jsonStr)
  });
}

wsServer.on('close', function() {
  clearInterval(interval);
});

wsServer.on('error', function(error) {
  log(`WebSocket server error: ${error.message}`);
});
