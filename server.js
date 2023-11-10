const fs = require('fs');
const WebSocket = require('ws');
const os = require("os");

const keywords = {
    'cat': ['https://kartinki.pics/uploads/posts/2022-12/1670131304_kartinkin-net-p-koreiskaya-korotkosherstnaya-koshka-instag-2.jpg', 
            'https://kartinki.pics/uploads/posts/2022-12/1670131336_kartinkin-net-p-koreiskaya-korotkosherstnaya-koshka-instag-9.jpg', 
            'https://kartinki.pics/uploads/posts/2022-12/1670131317_kartinkin-net-p-koreiskaya-korotkosherstnaya-koshka-instag-12.jpg'],
    'car': ['https://kartinki.pics/uploads/posts/2023-09/1693884886_kartinki-pics-p-okraska-avtomobilei-krasivo-1.jpg', 
            'https://kartinki.pics/uploads/posts/2023-09/thumbs/1693884928_kartinki-pics-p-okraska-avtomobilei-krasivo-8.jpg', 
            'https://kartinki.pics/uploads/posts/2023-09/thumbs/1693884950_kartinki-pics-p-okraska-avtomobilei-krasivo-4.jpg'],
    'frog': ['https://kartinki.pics/uploads/posts/2022-12/1672126058_kartinkin-net-p-smeshnie-lyagushki-kartinki-krasivo-11.jpg', 
            'https://kartinki.pics/uploads/posts/2022-12/1672126142_kartinkin-net-p-smeshnie-lyagushki-kartinki-krasivo-23.jpg', 
            'https://kartinki.pics/uploads/posts/2022-12/1672126118_kartinkin-net-p-smeshnie-lyagushki-kartinki-krasivo-32.jpg'],    
};

let MAX_CONCURRENT_THREADS = 1; 
fs.readFile('config.txt', 'utf8', function(err, data) {
  if (!err) {
    MAX_CONCURRENT_THREADS = Number(data);
    
  } else {
    console.error('Ошибка чтения файла конфигурации config.txt:', err);
  }
}); 

const websocket_server = new WebSocket.Server({ port: 8080 });

function status(response) {  
  if (response.status >= 200 && response.status < 300) {  
    return Promise.resolve(response)  
  } else {  
    return Promise.reject(new Error(response.statusText))  
  }  
}

function buffer(response) {  
  return response.arrayBuffer();
}

function _arrayBufferToBase64( buffer ) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return btoa( binary );
}

websocket_server.on('connection', (web_socket) => {
  console.log('Соединение с клиентом установлено');
  
  web_socket.on('message', (message) => {
    console.log(`Принято новое сообщение: ${message}`);

    try {
      const input_message = JSON.parse(message);
      
      let output_message = {
        REQUEST : input_message.REQUEST,
        DATA    : input_message.DATA,
      };

      if (input_message.REQUEST == "KEYWORD") {
        output_message.ANSWER = keywords[input_message.DATA]
      } else if (input_message.REQUEST == "LINK") {

        fetch(input_message.DATA)  
        .then(status)  
        .then(buffer)  
        .then(function(data) { 
            output_message.ANSWER = _arrayBufferToBase64(data);

            web_socket.send(JSON.stringify(output_message));
          })
        .catch(function(error) {  
            console.log('Ошибка в запросе!', error);  
        });

        return;

      } else {
        output_message.ANSWER = "FAIL";
      }
      const urls = keywords[message];

      let threadCount = 0; 

      if (threadCount < MAX_CONCURRENT_THREADS) {
        threadCount++;
    
        web_socket.send(JSON.stringify(output_message));
    
        console.log(`Запущен новый поток. (${threadCount} из ${MAX_CONCURRENT_THREADS})`);
      } else {
        console.log('Достигнуто максимальное количество параллельных потоков!!!');
      }
    } catch  (err) {
      console.log(err);
    }
  });

  web_socket.on('close', () => {
    console.log('Связь с клиентом разорвана!');
  });
});


console.log("Сервер запущен!");
console.log("Имя хоста:", os.hostname());