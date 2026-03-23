"use client"

import { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import { io } from "socket.io-client"

export default function VideoCall(){

const [stream,setStream] = useState<MediaStream | null>(null)
const [callReceived,setCallReceived] = useState(false)
const [callerSignal,setCallerSignal] = useState<any>(null)

const userVideo = useRef<HTMLVideoElement>(null)
const partnerVideo = useRef<HTMLVideoElement>(null)
const socketRef = useRef<any>(null)
const peerRef = useRef<any>(null)

useEffect(()=>{

socketRef.current = io("http://localhost:5000")

navigator.mediaDevices.getUserMedia({
video:true,
audio:true
}).then((currentStream)=>{

setStream(currentStream)

if(userVideo.current){
userVideo.current.srcObject = currentStream
}

})

// receive call
socketRef.current.on("call-made",(data:any)=>{
setCallReceived(true)
setCallerSignal(data.signal)
})

// answer received
socketRef.current.on("call-answered",(signal:any)=>{
if(peerRef.current){
peerRef.current.signal(signal)
}
})

return ()=>{
socketRef.current.disconnect()
}

},[])


// 🚀 CALL START
const startCall = ()=>{

peerRef.current = new Peer({
initiator:true,
trickle:false,
stream:stream!
})

peerRef.current.on("signal",(data:any)=>{
socketRef.current.emit("call-user",{
signal:data

})
})

peerRef.current.on("stream",(remoteStream:any)=>{
if(partnerVideo.current){
partnerVideo.current.srcObject = remoteStream
}
})

}


// ✅ ANSWER CALL
const answerCall = ()=>{

peerRef.current = new Peer({
initiator:false,
trickle:false,
stream:stream!
})

peerRef.current.on("signal",(data:any)=>{
socketRef.current.emit("answer-call",{
signal:data

})
})

peerRef.current.on("stream",(remoteStream:any)=>{
if(partnerVideo.current){
partnerVideo.current.srcObject = remoteStream
}
})

// 🔥 सबसे important
peerRef.current.signal(callerSignal)

}

return(

<div style={{display:"flex",gap:"20px",marginTop:"20px"}}>

<div>
<h3>Your Video</h3>
<video ref={userVideo} autoPlay playsInline muted style={{width:"300px"}} />
</div>

<div>
<h3>Other User</h3>
<video ref={partnerVideo} autoPlay playsInline style={{width:"300px"}} />
</div>

<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

<button onClick={startCall}>Start Call</button>

{callReceived && (
<button onClick={answerCall}>Answer Call</button>
)}

</div>

</div>

)
}