const express = require("express");
const http = require("http");
const { generateObject, generateLocationMessage } = require("./utils/messages");

const socketIO = require("socket.io");
const path = require("path");
const Filter = require("bad-words");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "../public");

app.use(express.static(publicDir));

// let count = 0;

io.on("connection", (socket) => {
  console.log("new web socket connection");
  // socket.emit('countChange', count);

  // socket.on('increment', ()=>{
  //     count++;
  //     // this emits the change only to one connection
  //     // socket.emit('countChange', count)

  //     io.emit("countChange", count);
  // })
  //sends to all user except current
  // socket.broadcast.emit("message", generateObject("A new user has joined"));

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    //socket.emit, io.emit, socket.broadcast.emit
    //io.to.emit, socket.broadcast.to.emit

    //sends to current user
    socket.emit("message", generateObject("admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateObject("admin", `${user.username} has joined`));

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }
    //sends to all users
    io.to(user.room).emit("message", generateObject(user.username, msg));
    callback("Delivered!");
  });

  socket.on("sendLocation", (pos, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${pos.latitude},${pos.longitude}`
      )
    );
    callback("location Shared");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateObject("admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("The server is now up at " + port);
});
