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

  // ---------------- USERNAME ----------------
  useEffect(()=>{
    const name = prompt("Enter your name")
    if(name){
      setUsername(name)
    }
  },[])

  // ---------------- LOAD DB ----------------
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

  // ---------------- SOCKET ----------------
  useEffect(()=>{

    socketRef.current = io("https://mentor-backend-i17a.onrender.com")

    if(sessionId){
      socketRef.current.emit("join-session", sessionId)

      // 🔥 SYSTEM MESSAGE
      if(username){
        socketRef.current.emit("send-message",{
          message: `${username} joined the session`,
          sessionId,
          system:true
        })
      }
    }

    socketRef.current.on("code-update",(newCode:string)=>{
      setCode(newCode)
    })

    socketRef.current.on("receive-message",(msg:any)=>{
      setMessages(prev=>[
        ...prev,
        {
          message: msg.message || msg,
          created_at: new Date().toISOString(),
          system: msg.system || false
        }
      ])
    })

    return ()=>{
      socketRef.current.disconnect()
    }

  },[sessionId,username])

  // ---------------- CODE ----------------
  const handleCodeChange = (value:any)=>{
    const newCode = value || ""
    setCode(newCode)

    socketRef.current.emit("code-change",{code:newCode,sessionId})
  }

  // ---------------- SEND MESSAGE ----------------
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

  // ---------------- CREATE SESSION ----------------
  const createSession = async ()=>{
    const res = await fetch("https://mentor-backend-i17a.onrender.com/create-session",{
      method:"POST"
    })
    const data = await res.json()
    alert(window.location.origin + "/editor?session=" + data.sessionId)
  }

  return(
    <div style={{display:"flex",height:"100vh"}}>

      <div style={{flex:2}}>

        <button onClick={createSession}>Create Session</button>

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

        <VideoCall />

      </div>

      <div style={{
        flex:1,
        borderLeft:"1px solid gray",
        display:"flex",
        flexDirection:"column",
        background:"white"
      }}>

        <div style={{flex:1,overflowY:"auto",padding:"10px"}}>
          {messages.map((msg,i)=>(
            <div key={i} style={{marginBottom:"10px"}}>

              {msg.system ? (
                <div style={{color:"gray",fontStyle:"italic"}}>
                  {msg.message}
                </div>
              ) : (
                <div>{msg.message}</div>
              )}

              <small style={{color:"gray"}}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </small>

            </div>
          ))}
        </div>

        <div style={{display:"flex",padding:"10px"}}>
          <input
            style={{flex:1,padding:"8px"}}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Type message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>

    </div>
  )
}