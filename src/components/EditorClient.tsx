"use client"

import Editor from "@monaco-editor/react"
import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import VideoCall from "@/components/VideoCall"
import { useSearchParams } from "next/navigation"

const socket = io("https://mentor-backend-i17a.onrender.com")

export default function EditorClient(){

  const [code,setCode] = useState("// start coding here")
  const [messages,setMessages] = useState<string[]>([])
  const [input,setInput] = useState("")

  const params = useSearchParams()
  const sessionId = params.get("session")

  useEffect(()=>{

    if(sessionId){
      socket.emit("join-session", sessionId)
    }

    socket.on("code-update",(newCode:string)=>{
      setCode(newCode)
    })

    socket.on("receive-message",(msg:string)=>{
      setMessages(prev=>[...prev,msg])
    })

    return ()=>{
      socket.off("code-update")
      socket.off("receive-message")
    }

  },[sessionId])

  const handleCodeChange = (value:any)=>{
    const newCode = value || ""
    setCode(newCode)
    socket.emit("code-change",{code:newCode,sessionId})
  }

  const sendMessage = ()=>{
    if(!input) return
    socket.emit("send-message",{message:input,sessionId})
    setMessages(prev=>[...prev,input])
    setInput("")
  }

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
            <div key={i}>{msg}</div>
          ))}
        </div>

        <div style={{display:"flex",padding:"10px"}}>
          <input
            style={{flex:1,padding:"8px"}}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>

    </div>
  )
}