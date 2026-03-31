"use client"

import { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import { io } from "socket.io-client"
import { useSearchParams } from "next/navigation"

export default function VideoCall() {

  const params = useSearchParams()
  const sessionId = params.get("session") || "default123"

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [callReceived, setCallReceived] = useState(false)
  const [callerSignal, setCallerSignal] = useState<any>(null)

  const userVideo = useRef<HTMLVideoElement>(null)
  const partnerVideo = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<any>(null)
  const peerRef = useRef<any>(null)

  useEffect(() => {

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    // ✅ JOIN SAME SESSION
    socketRef.current.emit("join-session", sessionId)

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    .then((currentStream) => {
      setStream(currentStream)

      if (userVideo.current) {
        userVideo.current.srcObject = currentStream
      }
    })
    .catch((err) => {
      console.log("Camera error", err)
    })

    // 📞 RECEIVE CALL
    socketRef.current.on("call-made", (data: any) => {
      setCallReceived(true)
      setCallerSignal(data.signal)
    })

    // 📞 CALL ACCEPTED
    socketRef.current.on("call-answered", (signal: any) => {
      if (peerRef.current) {
        peerRef.current.signal(signal)
      }
    })

    return () => {
      socketRef.current.disconnect()
    }

  }, [sessionId])

  // 🚀 START CALL
  const startCall = () => {

    if (!stream) return

    peerRef.current = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    })

    peerRef.current.on("signal", (data: any) => {
      socketRef.current.emit("call-user", {
        signal: data,
        sessionId
      })
    })

    peerRef.current.on("stream", (remoteStream: any) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = remoteStream
      }
    })
  }

  // ✅ ANSWER CALL
  const answerCall = () => {

    if (!stream) return

    peerRef.current = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })

    peerRef.current.on("signal", (data: any) => {
      socketRef.current.emit("answer-call", {
        signal: data,
        sessionId
      })
    })

    peerRef.current.on("stream", (remoteStream: any) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = remoteStream
      }
    })

    peerRef.current.signal(callerSignal)
  }

  return (
    <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>

      <div>
        <h3>Your Video</h3>
        <video
          ref={userVideo}
          autoPlay
          playsInline
          muted
          style={{ width: "300px", background: "black" }}
        />
      </div>

      <div>
        <h3>Other User</h3>
        <video
          ref={partnerVideo}
          autoPlay
          playsInline
          style={{ width: "300px", background: "black" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={startCall}>Start Call</button>

        {callReceived && (
          <button onClick={answerCall}>Answer Call</button>
        )}
      </div>

    </div>
  )
}