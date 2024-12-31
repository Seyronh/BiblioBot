var http = require('http');

http.createServer(function (req, res) {
    res.write("I'm Alive"); // Escribiendo en la respuesta
    res.end('Hello World!'); // Enviando la respuesta y finalizando
}).listen(8080);
