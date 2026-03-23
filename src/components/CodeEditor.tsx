"use client"

import Editor from "@monaco-editor/react"
import { useState, useEffect } from "react"
import { io } from "socket.io-client"

export default function CodeEditor(){

const [code,setCode] = useState("// start coding here")
const [socket,setSocket] = useState<any>(null)

useEffect(()=>{

const newSocket = io("http://localhost:5000")

setSocket(newSocket)

newSocket.on("connect",()=>{
console.log("User connected:",newSocket.id)
})

newSocket.on("code-update",(newCode:string)=>{
setCode(newCode)
})

return ()=>{
newSocket.disconnect()
}

},[])

const handleChange = (value:any)=>{

const newCode = value || ""

setCode(newCode)

if(socket){
socket.emit("code-change",newCode)
}

}

return(

<div style={{height:"500px"}}>

<Editor
height="100%"
defaultLanguage="javascript"
value={code}
theme="vs-dark"
onChange={handleChange}
/>

</div>

)

}