const socket = io.connect('http://localhost:3000');

let message = document.getElementById('chat-box');
let btn = document.getElementById('send-chat-button');
let output = document.getElementById('message-container');
let feedback = document.getElementById('feedback');

const userName = prompt('Enter your name...');
const userInfo = { name: userName };

let clearTimeoutID = null;

socket.emit('user-joined', userInfo.name);
socket.on('user-joined', (user) => {
    socket.emit('new-user-joined', user); //this event for host only to let him know the user identity.
});

btn.onclick = () => {
    socket.emit('chat', { message: message.value, name: userName });
};

socket.on('chat', (data) => {
    if (clearTimeoutID) {
        clearTimeout(clearTimeoutID);
        if (feedback.innerHTML) feedback.innerHTML = '';
    }
    output.innerHTML += '<p><i>' + data.name + ':</i>' + data.message + '</p>';
    message.value = '';
});

message.onkeydown = () => {
    socket.emit('typing', userName);
};

socket.on('typing', (name) => {
    checkFeedback();
    feedback.innerHTML = '<p><em>' + name + ' is typing...</em></p>';
});

const checkFeedback = () => {
    if (clearTimeoutID) {
        clearTimeout(clearTimeoutID);
        clearTimeoutID = null;
    }
    clearTimeoutID = setTimeout(() => {
        if (feedback.innerHTML) feedback.innerHTML = '';
    }, 2500);
};
