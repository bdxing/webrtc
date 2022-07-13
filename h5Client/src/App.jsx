import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ],
}

const App = () => {

    let constraints = {
        audio: {
            // 设置回音消除
            noiseSuppression: true,
            // 设置降噪
            echoCancellation: true,
        },
        video: false
    }
    let localStream
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            localStream = stream
        })
        .catch(function (err) {
            console.log(err)
        });

    const roomRef = useRef()
    const audioRef = useRef()

    let signalService

    const connectSignal = () => {
        if (signalService != null) {
            return
        }

        let room = roomRef.current.value
        let peerConnection

        signalService = io("test.com:888", { reconnection: true, transports: ["websocket"], query: {} })
        signalService.on('connect', () => {
            peerConnection = new RTCPeerConnection(config)
            // 音频轨道
            const audioTracks = localStream.getAudioTracks();
            // 判断音频轨道是否有值
            if (audioTracks.length > 0) {
                console.log(`使用的设备为: ${audioTracks[0].label}.`);
            }

            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream)
            })

            // 监听返回的 Candidate
            peerConnection.addEventListener('icecandidate', (event) => {
                if (event.candidate) {
                    console.log("icecandidate: ", event)
                    signalService.emit("icecandidate", JSON.stringify(event.candidate))
                }

            });
            // 监听 ICE 状态变化
            // peerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange)
            // //拿到流的时候调用
            peerConnection.addEventListener('track', (event)=>{
                console.log('remote 开始接受远端流,',event)
                if (event.streams[0]) {
                    audioRef.current.srcObject = event.streams[0];
                    audioRef.current.onloadedmetadata = function (e) {
                        audioRef.current.play();
                    };
                }
    
            });

            signalService.emit("join", "join")
        })

        signalService.on('join', (msg) => {
            peerConnection.createOffer().then(description => {

                console.log(`本地创建offer返回的sdp:\n${description.sdp}`)

                peerConnection.setLocalDescription(description).then(() => {

                    signalService.emit("offer", JSON.stringify(description))
                }).catch(err => {

                    console.log('local 设置本地描述信息错误', err)
                })
            }).catch(err => {

                console.log('createdOffer 错误', err);
            })
        })

        signalService.on('offer', (msg) => {
            let description = JSON.parse(msg)
            peerConnection.setRemoteDescription(new RTCSessionDescription(description)).then(() => {

            }).catch((err) => {
                console.log('local 设置远端描述信息错误', err);
            });
            peerConnection.createAnswer().then(function (answer) {

                peerConnection.setLocalDescription(answer).then(() => {
                    console.log('设置本地answer成功!');
                }).catch((err) => {
                    console.error('设置本地answer失败', err);
                });

                signalService.emit("answer", JSON.stringify(answer))
            }).catch(e => {
                console.error(e)
            });
        })

        signalService.on('answer', (msg) => {
            let description = JSON.parse(msg)
            peerConnection.setRemoteDescription(new RTCSessionDescription(description)).then(() => {
                console.log('设置remote answer成功!');
            }).catch((err) => {
                console.log('设置remote answer错误', err);
            });
        })

        signalService.on('icecandidate', (msg) => {
            let description = JSON.parse(msg)
            // 创建 RTCIceCandidate 对象
            let newIceCandidate = new RTCIceCandidate(description);

            // 将本地获得的 Candidate 添加到远端的 RTCPeerConnection 对象中
            peerConnection.addIceCandidate(newIceCandidate).then(() => {
                console.log(`addIceCandidate 成功`);
            }).catch((error) => {
                console.log(`addIceCandidate 错误:\n` + `${error.toString()}.`);
            });
        })

        signalService.on('error', (msg) => {
            console.log(msg)
        })
    }

    const testConnect = () => {
        signalService.emit("test", "test123");
    }

    return (
        <>
            <input ref={roomRef} type="text" />
            <button onClick={connectSignal}>连接</button>
            <button onClick={testConnect}>测试</button>
            <audio ref={audioRef}></audio>
        </>
    )
}

export default App