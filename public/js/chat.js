const socket = io();
// socket.on('countChange', (count)=>{
//     console.log("The count has been updated!", count);
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log("Clicked");
//     socket.emit('increment');
// })

const form = document.querySelector("#form");
const input = form.querySelector("input");
const button = form.querySelector("button");
const sendLocationButton = document.querySelector("#send-location");
const message = document.querySelector("#message");
const sidebar = document.querySelector('#sidebar');

const $messageTemplate = document.querySelector("#template").innerHTML;
const $urlTemplate = document.querySelector("#url-template").innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  // disable form button
  button.setAttribute("disabled", "disabled");

  //   const input = event.target.elements.msg;
  socket.emit("sendMessage", input.value, (error) => {
    button.removeAttribute("disabled");
    input.value = "";
    input.focus();
    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered!");
  });
});

sendLocationButton.addEventListener("click", () => {
  sendLocationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported");
  }

  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit(
      "sendLocation",
      { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      (msg) => {
        sendLocationButton.removeAttribute("disabled");
        console.log(msg);
      }
    );
  });
});

const autoscroll = () => {
    //new msg element
    const newMessage = message.lastElementChild;

    //height of new msg
    const newMsgStyles = getComputedStyle(newMessage);
    const newMsgMargin = parseInt(newMsgStyles.marginBottom);
    const newMsgHeight = newMessage.offsetHeight + newMsgMargin;

    //visible height
    const visibleHeight = message.offsetHeight;

    //height of msg container
    const containerHeight = message.scrollHeight;

    //how far have I scrolled
    const scrollOffset = message.scrollTop + visibleHeight;

    if(containerHeight-newMsgHeight<=scrollOffset){
        message.scrollTop = message.scrollHeight;
    }

}

socket.on("locationMessage", (msg) => {
  console.log(msg);
  const html = Mustache.render($urlTemplate, {
    username: msg.username,
    msg: msg.url,
    createdAt: moment(msg.timestamp).format("h:mm a"),
  });
  message.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("message", (msg) => {
  console.log(msg);
  const html = Mustache.render($messageTemplate, {
    username: msg.username,
    msg: msg.text,
    createdAt: moment(msg.timestamp).format("h:mm a"),
  });
  message.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render($sidebarTemplate, {
        room, users
    });
    sidebar.innerHTML = html;
    console.log(users);
})

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
