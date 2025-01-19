const fs = require('fs')
const path = require('path')

const express = require('express')

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
const server = app.listen(port, () => {
	log(`Server is started on http://localhost:${port}`)
});
