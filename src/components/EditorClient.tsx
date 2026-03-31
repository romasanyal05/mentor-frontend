"use client"

import Editor from "@monaco-editor/react"
import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import VideoCall from "@/components/VideoCall"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditorClient(){

  const socketRef = useRef<any>(null)

  const [code,setCode] = useState("// start coding here")
  const [messages,setMessages] = useState<any[]>([])
  const [input,setInput] = useState("")

  const [name,setName] = useState("")
  const [role,setRole] = useState("student")
  const [joined,setJoined] = useState(false)
  const [authChecked,setAuthChecked] = useState(false)

  const params = useSearchParams()
  const sessionId = params.get("session") || "default123"

  // 🔐 AUTH CHECK
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

  // CREATE SESSION
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })

    const data = await res.json()

    const newUrl = window.location.origin + "/editor?session=" + data.sessionId

    alert("Share this link: " + newUrl)

    navigator.clipboard.writeText(newUrl)

    window.location.href = "/editor?session=" + data.sessionId
  }

  // SOCKET
  useEffect(()=>{
    if(!joined) return

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    socketRef.current.emit("join-session", sessionId)

    socketRef.current.on("code-update",(newCode:string)=>{
      setCode(newCode)
    })

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

  // CODE CHANGE
  const handleCodeChange = (value:any)=>{
    const newCode = value || ""
    setCode(newCode)

    socketRef.current.emit("code-change",{code:newCode,sessionId})
  }

  // SEND MESSAGE
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

  // JOIN SCREEN
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
          borderRadius:"20px",
          boxShadow:"0 10px 25px rgba(0,0,0,0.2)",
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

        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h3>Live Classroom</h3>

          <div>
            <button onClick={createSession} style={{
              marginRight:"10px",
              background:"#22c55e",
              color:"white",
              padding:"8px 15px",
              borderRadius:"8px",
              border:"none",
              fontWeight:"bold"
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
          <button onClick={clearChat} style={{
            background:"#ef4444",
            color:"white",
            padding:"5px 10px",
            borderRadius:"6px",
            border:"none"
          }}>
            Clear Chat
          </button>
        </div>

        <div style={{flex:1,overflow:"auto",padding:"10px"}}>
          {messages.map((msg,i)=>(
            <div key={i} style={{
              marginBottom:"10px",
              padding:"10px",
              borderRadius:"10px",
              background: msg.role === "mentor" ? "#dbeafe" : "#fee2e2",
              border: msg.role === "mentor" ? "1px solid #3b82f6" : "1px solid #ef4444"
            }}>
              <b style={{
                color: msg.role === "mentor" ? "#1d4ed8" : "#b91c1c"
              }}>
                {msg.user}
              </b>
              <div>{msg.text}</div>
              <div style={{fontSize:"10px"}}>{msg.time}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",padding:"10px"}}>
          <input
            style={{
              flex:1,
              padding:"10px",
              borderRadius:"8px",
              border:"1px solid #ccc"
            }}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
          />
          <button onClick={sendMessage} style={{
            marginLeft:"8px",
            padding:"10px 15px",
            background:"#6366f1",
            color:"white",
            borderRadius:"8px",
            border:"none"
          }}>
            Send
          </button>
        </div>

      </div>

    </div>
  )
}