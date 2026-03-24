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
  const [username,setUsername] = useState("")

  const params = useSearchParams()
  const sessionId = params.get("session")

  // USERNAME
  useEffect(()=>{
    const name = prompt("Enter your name")
    if(name){
      setUsername(name)
    }
  },[])

  // LOAD OLD MESSAGES
  useEffect(()=>{
    const loadMessages = async ()=>{
      if(!sessionId) return

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at",{ascending:true})

      if(data){
        setMessages(data)
      }
    }

    loadMessages()
  },[sessionId])

  // SOCKET
  useEffect(()=>{

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    if(sessionId){
      socketRef.current.emit("join-session", sessionId)
    }

    socketRef.current.on("code-update",(newCode:string)=>{
      setCode(newCode)
    })

    socketRef.current.on("receive-message",(msg:any)=>{
      setMessages(prev=>[
        ...prev,
        {
          message: msg.message || msg,
          created_at: new Date().toISOString()
        }
      ])
    })

    return ()=>{
      socketRef.current.disconnect()
    }

  },[sessionId])

  // CODE CHANGE
  const handleCodeChange = (value:any)=>{
    const newCode = value || ""
    setCode(newCode)
    socketRef.current.emit("code-change",{code:newCode,sessionId})
  }

  // SEND MESSAGE
  const sendMessage = async ()=>{
    if(!input) return

    const fullMsg = `${username}: ${input}`

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

  // CREATE SESSION
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })
    const data = await res.json()
    alert(window.location.origin + "/editor?session=" + data.sessionId)
  }

  return(
    <div style={{
      display:"flex",
      height:"100vh",
      fontFamily:"Arial, sans-serif",
      background:"#f5f7fb"
    }}>

      {/* LEFT */}
      <div style={{
        flex:2,
        display:"flex",
        flexDirection:"column",
        padding:"10px"
      }}>

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          marginBottom:"10px"
        }}>
          <h3 style={{margin:0}}>💻 Mentor Collaboration Platform</h3>

          <button 
            onClick={createSession}
            style={{
              padding:"8px 12px",
              background:"#4f46e5",
              color:"white",
              border:"none",
              borderRadius:"6px",
              cursor:"pointer"
            }}
          >
            + Create Session
          </button>
        </div>

        <div style={{
          flex:1,
          borderRadius:"10px",
          overflow:"hidden",
          boxShadow:"0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            theme="vs-dark"
            onChange={handleCodeChange}
            options={{
              minimap:{enabled:false},
              automaticLayout:true
            }}
          />
        </div>

        <div style={{marginTop:"10px"}}>
          <VideoCall />
        </div>

      </div>

      {/* RIGHT CHAT */}
      <div style={{
        flex:1,
        display:"flex",
        flexDirection:"column",
        margin:"10px",
        background:"white",
        borderRadius:"10px",
        boxShadow:"0 2px 10px rgba(0,0,0,0.1)",
        overflow:"hidden"
      }}>

        <div style={{
          padding:"10px",
          borderBottom:"1px solid #eee",
          fontWeight:"bold"
        }}>
          💬 Chat
        </div>

        <div style={{
          flex:1,
          overflowY:"auto",
          padding:"10px"
        }}>

          {messages.map((msg,i)=>(
            <div key={i} style={{
              marginBottom:"10px",
              background:"#f1f5f9",
              padding:"8px",
              borderRadius:"6px"
            }}>
              <div style={{fontWeight:"500"}}>
                {msg.message}
              </div>

              <small style={{color:"gray"}}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </small>
            </div>
          ))}

        </div>

        <div style={{
          display:"flex",
          borderTop:"1px solid #eee"
        }}>

          <input
            style={{
              flex:1,
              padding:"10px",
              border:"none",
              outline:"none"
            }}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Type message..."
          />

          <button 
            onClick={sendMessage}
            style={{
              padding:"10px 15px",
              background:"#4f46e5",
              color:"white",
              border:"none",
              cursor:"pointer"
            }}
          >
            Send
          </button>

        </div>

      </div>

    </div>
  )
}