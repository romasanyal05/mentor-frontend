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

  // 🔐 AUTH
  const [user,setUser] = useState("")
  const [role,setRole] = useState("student")
  const [mode,setMode] = useState<"login"|"signup">("login")
  const [loggedIn,setLoggedIn] = useState(false)

  const params = useSearchParams()
  const sessionId = params.get("session")

  // ---------------- LOGIN / SIGNUP ----------------
  if(!loggedIn){
    return(
      <div style={{padding:"50px",textAlign:"center"}}>
        <h2>{mode === "login" ? "Login" : "Signup"}</h2>

        <input
          placeholder="Enter name"
          value={user}
          onChange={(e)=>setUser(e.target.value)}
          style={{padding:"10px"}}
        />

        <br/><br/>

        <select onChange={(e)=>setRole(e.target.value)}>
          <option value="mentor">Mentor</option>
          <option value="student">Student</option>
        </select>

        <br/><br/>

        <button onClick={()=>setLoggedIn(true)}>
          {mode === "login" ? "Login" : "Signup"}
        </button>

        <br/><br/>

        <button onClick={()=>setMode(mode==="login"?"signup":"login")}>
          Switch to {mode==="login"?"Signup":"Login"}
        </button>
      </div>
    )
  }

  // ---------------- CRDT ----------------
  useEffect(()=>{

    if(!sessionId) return

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

  },[sessionId])

  // ---------------- SOCKET ----------------
  useEffect(()=>{

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    if(sessionId){
      socketRef.current.emit("join-session", sessionId)

      socketRef.current.emit("send-message",{
        message: `${role}:${user} joined`,
        sessionId
      })
    }

    socketRef.current.on("receive-message",(msg:any)=>{
      setMessages(prev=>[
        ...prev,
        {
          message: msg.message || msg,
          created_at: new Date().toISOString()
        }
      ])
    })

    socketRef.current.on("session-cleared",()=>{
      setMessages([])
      setCode("")
    })

    return ()=>{
      socketRef.current.disconnect()
    }

  },[sessionId,user,role])

  // ---------------- LOAD CHAT ----------------
  useEffect(()=>{
    const load = async ()=>{
      if(!sessionId) return

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)

      if(data) setMessages(data)
    }
    load()
  },[sessionId])

  // ---------------- CODE ----------------
  const handleCodeChange = (value:any)=>{
    if(!yTextRef.current) return

    const yText = yTextRef.current
    yText.delete(0, yText.length)
    yText.insert(0, value || "")
  }

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async ()=>{
    if(!input) return

    const fullMsg = `${role}:${user}: ${input}`

    socketRef.current.emit("send-message",{
      message: fullMsg,
      sessionId
    })

    await supabase.from("messages").insert([
      { session_id: sessionId, message: fullMsg }
    ])

    setMessages(prev=>[
      ...prev,
      { message: fullMsg }
    ])

    setInput("")
  }

  // ---------------- CREATE SESSION ----------------
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })
    const data = await res.json()

    alert(window.location.origin + "/editor?session=" + data.sessionId)
  }

  // ---------------- CLEAR CHAT ----------------
  const clearChat = async ()=>{
    setMessages([])

    await supabase
      .from("messages")
      .delete()
      .eq("session_id", sessionId)
  }

  // ---------------- UI ----------------
  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{flex:2,padding:"10px"}}>

        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h3>💻 Classroom</h3>

          <div>
            <button onClick={createSession}>Create</button>
            <button onClick={clearChat} style={{background:"red",color:"white"}}>
              Clear Chat
            </button>
          </div>
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

          {messages.map((msg,i)=>{
            const isMentor = msg.message?.includes("mentor")

            return (
              <div
                key={i}
                style={{
                  color: isMentor ? "blue" : "red",
                  fontWeight:"bold"
                }}
              >
                {msg.message}
              </div>
            )
          })}

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