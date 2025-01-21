const fs = require('fs')
const express = require('express')

const log = console.log;
const expressApp = express();
const httpPort = 8080;

// раздача файлов приложения
const filesToHost = [
  {
    url: '/',
    local_path: './public_files/index.html'
  },
  {
    url: '/client_script.js',
    local_path: './public_files/client_script.js'
  },
]
for (let fileInfo of filesToHost) {
  expressApp.get(fileInfo.url, async (req, res) => {
    fs.createReadStream(fileInfo.local_path).pipe(res)
  });
}

// запускаем http сервер, раздающий файлы
const httpServer = expressApp.listen(httpPort, () => {
	log(`http server is started on http://localhost:${httpPort}`)
});
