let socket = new WebSocket('ws://localhost:8081/')

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
}

// получение входящих сообщений
socket.onmessage = async function(event) {
  try {
    console.log('event from wsServer: ', event)
    
    const obj = JSON.parse(event.data)
    const { type, data } = obj

    switch (type) {
      case "get_message":
        showMessage(data)
        break
      case 'error':
        console.log(`received message of 'error' type: ${data}`)
        break
      default:
        console.error('unexpected event type')
    }

  } catch (e) {
    console.error('error on socket.onmessage: ', e)
  }
}

// обработка закрытия соединения
socket.onclose = (event) => {
  const message = `Connection closed, code ${event.code}`
  showMessage(message)
  console.log(message)
  console.log(event)
}

// отображение информации (сообщений)
function showMessage(message) {
  let divElem = document.createElement('div')
  divElem.textContent = message
  
  document.getElementById('messages-container')
    .prepend(divElem)
}
