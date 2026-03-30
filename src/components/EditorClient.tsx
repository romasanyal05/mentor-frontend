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
  const editorRef = useRef<any>(null)

  const [code,setCode] = useState("")
  const [messages,setMessages] = useState<any[]>([])
  const [input,setInput] = useState("")

  const [user,setUser] = useState("")
  const [role,setRole] = useState("student")
  const [loggedIn,setLoggedIn] = useState(false)

  const params = useSearchParams()
  const sessionId = params.get("session")

  // ---------------- LOGIN ----------------
  if(!loggedIn){
    return(
      <div style={{padding:"50px",textAlign:"center"}}>
        <h2>Join Classroom</h2>
        <input
          placeholder="Enter your name"
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
          Enter
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
        message: `${user} joined`,
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

  },[sessionId,user])

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

  // ---------------- CODE CHANGE ----------------
  const handleCodeChange = (value:any)=>{
    if(!yTextRef.current) return

    const yText = yTextRef.current

    yText.delete(0, yText.length)
    yText.insert(0, value || "")
  }

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async ()=>{

    if(!input) return

    const fullMsg = `${user}: ${input}`

    socketRef.current.emit("send-message",{
      message: fullMsg,
      sessionId
    })

    await supabase.from("messages").insert([
      {
        session_id: sessionId,
        message: fullMsg
      }
    ])

    setMessages(prev=>[
      ...prev,
      {
        message: fullMsg,
        created_at: new Date().toISOString()
      }
    ])

    setInput("")
  }

  // ---------------- CREATE SESSION ----------------
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })
    const data = await res.json()

    alert("Share this link: " + window.location.origin + "/editor?session=" + data.sessionId)
  }

  // ---------------- CLEAR SESSION ----------------
  const clearSession = async ()=>{

    if(!sessionId) return

    setMessages([])
    setCode("")

    await supabase
      .from("messages")
      .delete()
      .eq("session_id", sessionId)

    if(yTextRef.current){
      yTextRef.current.delete(0, yTextRef.current.length)
    }

    socketRef.current.emit("session-cleared",sessionId)
  }

  // ---------------- UI ----------------
  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{flex:2,padding:"10px"}}>

        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h3>💻 Classroom Editor</h3>

          <div>
            <button onClick={createSession}>Create</button>
            <button onClick={clearSession} style={{background:"red",color:"white"}}>
              Clear
            </button>
          </div>
        </div>

        <Editor
          height="80%"
          value={code}
          theme="vs-dark"
          onChange={handleCodeChange}
          onMount={(editor)=>{editorRef.current = editor}}
        />

        <VideoCall />

      </div>

      {/* CHAT */}
      <div style={{flex:1,background:"white",padding:"10px"}}>

        <h3>💬 Chat</h3>

        <div style={{height:"70%",overflow:"auto"}}>
          {messages.map((msg,i)=>(
            <div key={i}>
              {msg.message}
            </div>
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