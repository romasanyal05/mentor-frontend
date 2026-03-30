"use client"

import Editor from "@monaco-editor/react"
import { useState, useEffect, useRef } from "react"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
import { io } from "socket.io-client"
import VideoCall from "@/components/VideoCall"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditorClient(){

  const socketRef = useRef<any>(null)
  const yTextRef = useRef<any>(null)

  const [code,setCode] = useState("")
  const [messages,setMessages] = useState<any[]>([])
  const [input,setInput] = useState("")

  const params = useSearchParams()
  let sessionId = params.get("session")

  // ✅ AUTO SESSION FIX (CRASH PROTECTION)
  useEffect(()=>{
    if(!sessionId){
      window.location.href = "/editor?session=default123"
    }
  },[sessionId])

  // ---------------- CRDT ----------------
  useEffect(()=>{

    if(!sessionId) return

    try{
      const ydoc = new Y.Doc()

      const provider = new WebsocketProvider(
        "wss://demos.yjs.dev",
        sessionId,
        ydoc
      )

      const yText = ydoc.getText("monaco")
      yTextRef.current = yText

      yText.observe(()=>{
        setCode(yText.toString())
      })

      return ()=>{
        provider.disconnect()
        ydoc.destroy()
      }

    }catch(err){
      console.log("CRDT error:", err)
    }

  },[sessionId])

  // ---------------- SOCKET ----------------
  useEffect(()=>{

    if(!sessionId) return

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    socketRef.current.emit("join-session", sessionId)

    socketRef.current.on("receive-message",(msg:any)=>{
      setMessages(prev=>[...prev,msg])
    })

    return ()=>{
      socketRef.current.disconnect()
    }

  },[sessionId])

  // ---------------- CODE ----------------
  const handleCodeChange = (value:any)=>{
    if(!yTextRef.current) return

    const yText = yTextRef.current
    yText.delete(0, yText.length)
    yText.insert(0, value || "")
  }

  // ---------------- MESSAGE ----------------
  const sendMessage = async ()=>{
    if(!input) return

    socketRef.current.emit("send-message",{message:input,sessionId})

    setMessages(prev=>[...prev,input])
    setInput("")
  }

  // ---------------- CREATE SESSION ----------------
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })
    const data = await res.json()

    window.location.href = "/editor?session=" + data.sessionId
  }

  // ---------------- UI ----------------
  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{flex:2,padding:"10px"}}>

        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h3>💻 Classroom</h3>

          <button onClick={createSession}>
            Create Session
          </button>
        </div>

        <Editor
          height="80%"
          value={code}
          theme="vs-dark"
          onChange={handleCodeChange}
        />

        <VideoCall />

      </div>

      {/* CHAT */}
      <div style={{flex:1,background:"white",padding:"10px"}}>

        <h3>💬 Chat</h3>

        <div style={{height:"70%",overflow:"auto"}}>
          {messages.map((msg,i)=>(
            <div key={i}>{msg}</div>
          ))}
        </div>

        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
        />

        <button onClick={sendMessage}>Send</button>

      </div>

    </div>
  )
}