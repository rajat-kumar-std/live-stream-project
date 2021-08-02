window.onload = () => {
    document.getElementById('view-stream-button').onclick = () => {
        initStream();
    };
};

let clientPeerConnnection;
// let clientDataChannel;

const initStream = async () => {
    const peer = createPeer();
    clientPeerConnnection = peer;
    peer.addTransceiver('video', { direction: 'recvonly' });
    peer.addTransceiver('audio', { direction: 'recvonly' });

    // clientDataChannel = clientPeerConnnection.createDataChannel('sendChannel');
    // clientPeerConnnection.ondatachannel = handleDataChannelEvent;
};

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org',
            },
        ],
    });
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
    };
    const { data } = await axios.post('/client', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch((err) => console.log(err));
}

const handleTrackEvent = (event) => {
    document.getElementById('stream-video').srcObject = event.streams[0];
};