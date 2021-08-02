const socket = io.connect('http://localhost:3000');

let message = document.getElementById('chat-box');
let btn = document.getElementById('send-chat-button');
let output = document.getElementById('message-container');
let feedback = document.getElementById('feedback');
const userName = prompt('Enter your name...');
const participants = []; //when a new participants is join or leave the stream it will be effected here by his id and name.
// count participants to find number of joiner in stream.

let clearTimeoutID = null;

socket.on('new-user-joined', (user) => {
    // when a new user joined it will be added to the paricipants array.
    participants.push(user);
    console.log(participants);
});

socket.on('user-disconnected', (userId) => {
    // when a joined user disconnected it will be removed from the paricipants array.
    participants.forEach((participant, index) => {
        if (participant.id === userId) {
            participants.splice(index, 1);
        }
        console.log(`${participant.name} is disconnected`);
    });
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
