const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require('wrtc');
// for chat start
const socket = require('socket.io');
const server = app.listen(3000, () => {
    console.log('Server is active at 3000...');
});
const io = socket(server);
//for chat end

var senderStream;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/host', async ({ body }, res) => {
    const peer = createPeer();
    peer.ontrack = (event) => handleTrackEvent(event, peer);
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription,
    };
    res.json(payload);
});

function handleTrackEvent(event, peer) {
    senderStream = event.streams[0];
}

app.post('/client', async ({ body }, res) => {
    const peer = createPeer();
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    if (senderStream) {
        senderStream
            .getTracks()
            .forEach((track) => peer.addTrack(track, senderStream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription,
        };
        res.json(payload);
    } else {
        console.log('Stream is not Started yet.'); //how to send this message as a alert box.
        // res.send("<script>alert('Stream is not Started yet.');window.location.href ='/client/client.html'</script>");
    }
});

const createPeer = () => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org',
            },
        ],
    });
    return peer;
};

// app.listen(3000, () => console.log('server started at 3000'));

//message code
io.on('connection', (socket) => {
    // console.log(socket.id);  => can be used to assign a unique value to a user or a space
    socket.on('user-joined', (uname) => {
        const newUser = {
            name: uname,
            id: socket.id,
        };
        console.log('new user joined:', newUser);
        io.sockets.emit('new-user-joined', newUser);
    });

    socket.on('chat', (data) => {
        //data receive message and name
        io.sockets.emit('chat', data);
    });
    socket.on('typing', (name) => {
        socket.broadcast.emit('typing', name);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected: ', socket.id);
        io.sockets.emit('user-disconnected', socket.id);
    });
});
