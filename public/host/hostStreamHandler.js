
if (adapter.browserDetails.browser == 'firefox') {
    adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

const webcamVideoPlayer = document.getElementById('webcam-video');
const screenVideoPlayer = document.getElementById('screen-video');

const startStreamButton = document.getElementById('start-stream-button');
const stopStreamButton = document.getElementById('stop-stream-button');

const startVideoButton = document.getElementById('start-video-button');
const stopVideoButton = document.getElementById('stop-video-button');

const muteButton = document.getElementById('mute-audio-button');
const unmuteButton = document.getElementById('unmute-audio-button');

const startShareButton = document.getElementById('start-share-button');
const stopShareButton = document.getElementById('stop-share-button');

const startRecordingButton = document.getElementById('start-rec-button');
const stopRecordingButton = document.getElementById('stop-rec-button');
const pauseRecordingButton = document.getElementById('pause-rec-button');
const resumeRecordingButton = document.getElementById('resume-rec-button');
const downloadRecordingButton = document.getElementById('download-rec-button');

let audioTrack = null;
let videoTrack = null;
let screenTrack = null;

let isStreamStarted = false;
let isMuted = true;

let hostPeerConnection = null;
let mainStream = new MediaStream(); // initially undefined

let recordingStream = null;
let recorder = null;
let recordedChunks = [];

const startStream = () => {
    if (!isStreamStarted) {
        if (videoTrack || screenTrack) {
            const peer = createPeer();
            hostPeerConnection = peer;
            console.log('Strem is started.');
            if (screenTrack) {
                hostPeerConnection.addTrack(screenTrack, mainStream);
                console.log('Screen is shared.');
            } else if (videoTrack) {
                hostPeerConnection.addTrack(videoTrack, mainStream);
                console.log('Video is Shared.');
            }

            if (audioTrack) {
                hostPeerConnection.addTrack(audioTrack, mainStream);
                if (isMuted) {
                    audioTrack.enabled = false;
                }
                if (!isMuted) {
                    audioTrack.enabled = true;
                    console.log('Audio is Shared.');
                }
            }
            isStreamStarted = true;
        } else {
            console.log('Share at least one stream to start stream.');
        }
    } else {
        console.log('Stream is already started.');
    }
};

const startVideo = () => {
    if (!videoTrack) {
        getWebcam(); //gets host audio and video track
    } else {
        console.log('Video is already started.');
    }
};

const getWebcam = () => {
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
            videoTrack = stream.getVideoTracks()[0];
            if (!audioTrack) {
                audioTrack = stream.getAudioTracks()[0];
                audioTrack.enabled = false;
            }
            webcamVideoPlayer.srcObject = new MediaStream([videoTrack]);
            console.log('Host Video track is on.');
            if (!screenTrack && hostPeerConnection) {
                hostPeerConnection.addTrack(videoTrack, mainStream);
                if (!audioTrack) {
                    hostPeerConnection.addTrack(audioTrack, mainStream);
                }
            }
            // videoTrack.onended = () => {};
        })
        .catch((err) => {
            console.log('Error while getting user video::', err.name);
        });
};

const unmuteAudio = () => {
    if (audioTrack) {
        if (!audioTrack.enabled) {
            audioTrack.enabled = true;
            isMuted = false;
            console.log('Audio is unmuted.');
        }
    } else {
        console.log('Audio is not available, Start video to get the audio.');
    }
};

const muteAudio = () => {
    if (audioTrack) {
        if (audioTrack.enabled && !isMuted) {
            audioTrack.enabled = false;
            isMuted = true;
            console.log('Audio is muted.');
        } else {
            console.log('Audio is already muted.');
        }
    } else {
        console.log('Audio is not available, Start video to get the audio.');
    }
};

const startShare = () => {
    if (!screenTrack) {
        getScreen();
    } else {
        console.log('Screen is already shared.');
    }
};

const getScreen = () => {
    navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((stream) => {
            screenTrack = stream.getVideoTracks()[0];
            screenVideoPlayer.srcObject = new MediaStream([screenTrack]);
            console.log('Screen track is on.');
            if (videoTrack && hostPeerConnection) {
                let sender = hostPeerConnection.getSenders().find((stream) => {
                    return stream.track.kind === videoTrack.kind;
                });
                sender.replaceTrack(screenTrack);
            } else if (hostPeerConnection) {
                hostPeerConnection.addTrack(screenTrack, mainStream);
            }
            // screenTrack.onended = () => {};
        })
        .catch((err) => {
            console.log('Error while getting screen track::', err.name);
        });
};

const stopStream = () => {
    if (isStreamStarted && hostPeerConnection) {
        if (videoTrack) {
            videoTrack.stop();
            videoTrackEnded();
        }
        if (screenTrack) {
            screenTrack.stop();
            screenTrackEnded();
        }
        if (audioTrack) {
            audioTrack.stop();
        }
        hostPeerConnection.close(); // close connection in the end => after discontinuing the tracks
        // to not through an error in video track ended.
        isStreamStarted = false;
    } else {
        console.log('Stream is not Started.');
    }
    // can we handle the client page on stop stream?
};

const stopVideo = () => {
    if (videoTrack) {
        if (screenTrack) {
            videoTrack.stop();
            videoTrackEnded();
        } else {
            console.log('Cannot Stop video, at least one stream is required');
        }
    } else {
        console.log('Video is not started.');
    }
};

const stopShare = () => {
    if (screenTrack) {
        if (videoTrack) {
            screenTrack.stop();
            screenTrackEnded();
        } else {
            console.log('Cannot stop share, at least one stream is required.');
        }
    } else {
        console.log('Screen is not shared.');
    }
};

const videoTrackEnded = () => {
    if (screenTrack && hostPeerConnection) {
        let sender = hostPeerConnection.getSenders().find((stream) => {
            return stream.track.kind === videoTrack.kind;
        });
        sender.replaceTrack(screenTrack);
    }
    videoTrack = null;
    webcamVideoPlayer.srcObject = null;
    console.log('Host video track is ended.');
};

const screenTrackEnded = () => {
    if (videoTrack && hostPeerConnection) {
        let sender = hostPeerConnection.getSenders().find((stream) => {
            return stream.track.kind === screenTrack.kind;
        });
        sender.replaceTrack(videoTrack);
    }
    screenTrack = null;
    screenVideoPlayer.srcObject = null;
    console.log('Screen track is ended.');
};

window.onload = () => {
    startStreamButton.onclick = () => {
        startStream();
    };
    stopStreamButton.onclick = () => {
        stopStream();
    };
    muteButton.onclick = () => {
        muteAudio();
    };
    unmuteButton.onclick = () => {
        unmuteAudio();
    };
    startVideoButton.onclick = () => {
        startVideo();
    };
    stopVideoButton.onclick = () => {
        stopVideo();
    };
    startShareButton.onclick = () => {
        startShare();
    };
    stopShareButton.onclick = () => {
        stopShare();
    };
    startRecordingButton.onclick = () => {
        mergeIntoSingleStream();
        startRecording();
        recorder.start();
    };
    stopRecordingButton.onclick = () => {
        recorder.stop();
    };
    pauseRecordingButton.onclick = () => {
        recorder.pause();
    };
    resumeRecordingButton.onclick = () => {
        recorder.resume();
    };
};

const startRecording = () => {
    recordedChunks = [];
    recorder = new MediaRecorder(recordingStream, {
        mimeType: 'video/webm; codecs=vp8,opus',
    });
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };
    recorder.onstart = () => {
        //start by recorder.start()
        console.log('Recording Started.');
    };
    recorder.onstop = () => {
        console.log('Recording Stoped.');
        var blob = new Blob(recordedChunks, { type: 'video/webm' });
        let recordingURL = window.URL.createObjectURL(blob);
        downloadRecordingButton.href = recordingURL;
    };
    recorder.onpause = () => {
        console.log('Recording Paused.');
    };
    recorder.onresume = () => {
        console.log('Recording Resume.');
    };
};

const mergeIntoSingleStream = () => {
    let streamHeight = 0;
    let streamWidth = 0;

    if (screenTrack) {
        streamHeight = screenTrack.getSettings().height;
        streamWidth = screenTrack.getSettings().width;
    } else if (videoTrack) {
        streamHeight = videoTrack.getSettings().height;
        streamWidth = videoTrack.getSettings().width;
    }

    let streamMerger = new VideoStreamMerger({
        height: streamHeight,
        width: streamWidth,
        // fps: 30,
    });

    // screen and host both
    if (
        videoTrack &&
        screenTrack &&
        videoTrack.readyState === 'live' &&
        screenTrack.readyState === 'live'
    ) {
        streamMerger.addStream(new MediaStream([screenTrack]), {
            x: 0,
            y: 0,
            mute: true,
        });

        streamMerger.addStream(new MediaStream([videoTrack]), {
            // x:0,y:0,(top left corner)
            // following x and y values set this strem at the right bottom corner
            y: streamMerger.height - 150,
            x: streamMerger.width - 300,
            height: 150,
            width: 300,
            mute: true,
        });
    } else if (videoTrack && videoTrack.readyState === 'live') {
        streamMerger.addStream(new MediaStream([videoTrack]), {
            x: 0,
            y: 0,
            mute: true,
        });
    } else if (screenTrack && screenTrack.readyState === 'live') {
        streamMerger.addStream(new MediaStream([screenTrack]), {
            x: 0,
            y: 0,
            mute: true,
        });
    }

    if (audioTrack && audioTrack.readyState === 'live') {
        streamMerger.addStream(new MediaStream([audioTrack]), {
            mute: false,
        });
    }

    streamMerger.start();
    recordingStream = streamMerger.result;
};

const createPeer = () => {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org',
            },
        ],
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    return peer;
};

const handleNegotiationNeededEvent = async (peer) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
    };
    const { data } = await axios.post('/host', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch((err) => console.log(err));
};

//end of code
//==============================================================
