let socket = new WebSocket('ws://localhost:8080/')

// отправка нового сообщения на сервер
document.getElementById('send-button').onclick = function() {
  const messageInput = document.getElementById('message-input')
  const message = messageInput.value

  const jsonStr = JSON.stringify({ 
    type: 'post_message', 
    data: message 
  })
  socket.send(jsonStr)

  messageInput.value = ""
};

// получение входящих сообщений
socket.onmessage = async function(event) {
  try {
    console.log('event from wsServer: ', event)
    
    // если приходит в виде blob, а не строки
    // await event.data.text()
    // ...
    
    // если приходит в виде строки
    let { type, data } = JSON.parse(event.data)
    
    if (type == "get_message") {
      showMessage(data)
    } else if (type == "error") {
      alert(`Error: ${data}`)
    } else {
      throw "unexpected event type"
    }
  } catch (e) {
    console.error('error on socket.onmessage: ', e)
  }
};

// обработка закрытия соединения
socket.onclose = (event) => {
  const message = `Connection closed, code ${event.code}`
  showMessage(message)
  console.log(message)
  console.log(event)
}

// отображение информации (сообщений)
function showMessage(message) {
  let messageElem = document.createElement('div')
  messageElem.textContent = message
  document.getElementById('messages-container').prepend(messageElem)
}
