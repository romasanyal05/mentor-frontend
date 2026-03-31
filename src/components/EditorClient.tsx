"use client"

import Editor from "@monaco-editor/react"
import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
import VideoCall from "@/components/VideoCall"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditorClient(){

  const socketRef = useRef<any>(null)
  const yTextRef = useRef<any>(null)

  const [code,setCode] = useState("// start coding")
  const [messages,setMessages] = useState<any[]>([])
  const [input,setInput] = useState("")

  const [name,setName] = useState("")
  const [role,setRole] = useState("student")
  const [joined,setJoined] = useState(false)
  const [authChecked,setAuthChecked] = useState(false)

  const params = useSearchParams()
  const sessionId = params.get("session") || "default123"

  // 🔐 LOGIN CHECK
  useEffect(()=>{
    const check = async ()=>{
      const { data } = await supabase.auth.getSession()
      if(!data.session){
        window.location.href = "/login"
      }else{
        setAuthChecked(true)
      }
    }
    check()
  },[])

  // AUTO JOIN
  useEffect(()=>{
    const savedName = localStorage.getItem("username")
    const savedRole = localStorage.getItem("role")

    if(savedName && savedRole){
      setName(savedName)
      setRole(savedRole)
      setJoined(true)
    }
  },[])

  // JOIN
  const joinSession = ()=>{
    if(!name) return alert("Enter name")

    localStorage.setItem("username", name)
    localStorage.setItem("role", role)

    setJoined(true)
  }

  // 🆕 CREATE SESSION
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })

    const data = await res.json()

    const newUrl = window.location.origin + "/editor?session=" + data.sessionId

    alert("Share this link: " + newUrl)

    window.location.href = "/editor?session=" + data.sessionId
  }

  // CRDT
  useEffect(()=>{
    if(!joined) return

    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider("wss://mentor-backend-i17a.onrender.com/yjs", sessionId, ydoc)

    const yText = ydoc.getText("monaco")
    yTextRef.current = yText

    yText.observe(()=>{
      setCode(yText.toString())
    })

    return ()=>{
      provider.disconnect()
      ydoc.destroy()
    }
  },[joined,sessionId])

  // SOCKET
  useEffect(()=>{
    if(!joined) return

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    socketRef.current.emit("join-session", sessionId)

    socketRef.current.on("receive-message",(msg:any)=>{

      if(msg.type === "clear"){
        setMessages([])
      }else{
        setMessages(prev=>[...prev,msg])
      }

    })

    return ()=>{
      socketRef.current.disconnect()
    }
  },[joined,sessionId])

  // CODE
  const handleCodeChange = (value:any)=>{
    const newCode = value || ""
    setCode(newCode)

    if(yTextRef.current){
      const yText = yTextRef.current
      yText.delete(0, yText.length)
      yText.insert(0, newCode)
    }

    socketRef.current?.emit("code-change",{code:newCode,sessionId})
  }

  // CHAT
  const sendMessage = ()=>{
    if(!input) return

    const msgData = {
      text: input,
      user: name,
      role: role,
      time: new Date().toLocaleTimeString()
    }

    socketRef.current.emit("send-message",{...msgData,sessionId})
    setMessages(prev=>[...prev,msgData])
    setInput("")
  }

  // CLEAR CHAT
  const clearChat = ()=>{
    socketRef.current.emit("send-message",{
      type:"clear",
      sessionId
    })
    setMessages([])
  }

  const logout = ()=>{
    localStorage.clear()
    window.location.href = "/login"
  }

  if(!authChecked){
    return <div style={{padding:"50px"}}>Loading...</div>
  }

  if(!joined){
    return(
      <div style={{
        height:"100vh",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        background:"linear-gradient(135deg,#667eea,#764ba2)"
      }}>
        <div style={{
          background:"white",
          padding:"30px",
          borderRadius:"15px",
          display:"flex",
          flexDirection:"column",
          gap:"10px"
        }}>
          <h2>Join Classroom</h2>

          <input
            placeholder="Enter name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="mentor">Mentor</option>
            <option value="student">Student</option>
          </select>

          <button onClick={joinSession}>Join</button>
        </div>
      </div>
    )
  }

  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{flex:2,padding:"10px"}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h3>Live Classroom</h3>

          <div>
            <button onClick={createSession} style={{
              marginRight:"10px",
              background:"green",
              color:"white"
            }}>
              Create Session
            </button>

            <button onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <Editor
          height="60vh"
          value={code}
          theme="vs-dark"
          onChange={handleCodeChange}
        />

        <VideoCall />

      </div>

      {/* CHAT */}
      <div style={{flex:1,background:"white",display:"flex",flexDirection:"column"}}>

        <div style={{display:"flex",justifyContent:"space-between",padding:"10px"}}>
          <h4>Chat</h4>
          <button onClick={clearChat}>Clear Chat</button>
        </div>

        <div style={{flex:1,overflow:"auto",padding:"10px"}}>
          {messages.map((msg,i)=>(
            <div key={i} style={{
              marginBottom:"10px",
              padding:"10px",
              borderRadius:"10px",
              background: msg.role === "mentor" ? "#e6f4ff" : "#ffe6e6"
            }}>
              <b style={{color: msg.role === "mentor" ? "blue" : "red"}}>
                {msg.user}
              </b>
              <div>{msg.text}</div>
              <div style={{fontSize:"10px"}}>{msg.time}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",padding:"10px"}}>
          <input
            style={{flex:1}}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>

    </div>
  )
}