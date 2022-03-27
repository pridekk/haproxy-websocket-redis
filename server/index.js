// Setup basic express server
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const adapter = require("@socket.io/redis-adapter");
const redis = require('ioredis');
const port = process.env.PORT || 3000;
const serverName = process.env.NAME || 'Unknown';

const redis_hosts = process.env.REDIS_HOSTS 
const redis_password = process.env.REDIS_PASSWORD

let redis_config = []

redis_hosts.split(",").forEach(element => {
  redis_config.push({
    port: 6379,
    host: element
  })
});

console.log(redis_config)
const pubClient = new redis.Cluster(
  redis_config,
{
  redisOptions: {
    password: redis_password,
  }
});

const subClient = pubClient.duplicate();

io.adapter(adapter.createAdapter(pubClient, subClient));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
  console.log('Hello, I\'m %s, how can I help?', serverName);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Health check
app.head('/health', function (req, res) {
  res.sendStatus(200);
});

// Chatroom

let numUsers = 0;

io.on('connection', function (socket) {
  socket.emit('my-name-is', serverName);

  let addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
  // 수신하고자하는 Redis Data Channel 
  socket.join('data-channel')
});


// Redis 구독 
subClient.subscribe("data", (err) => {
  if(err){
    console.log(`Error: ${err}`)
  }
})

// Redis에서 구독된 데이터 수신 처리 
subClient.on("message", (channel, message) => {
  try{
      if(channel === "data"){
        io.to('data-channel').emit('new message', {
          username: "from server",
          message: message
        })
      } else {
        console.log(`{}, {} is not sent to client`)
      }
      
  } catch (exception){
    console.log(exception)
  }

});