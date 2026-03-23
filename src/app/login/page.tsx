"use client"

import { useState } from "react"

export default function Login(){

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const handleLogin = async () => {

 await fetch("http://localhost:5000/login",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body: JSON.stringify({email,password})
 })

}

return(

<div>

<h1>Login</h1>

<input
placeholder="Email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password"
onChange={(e)=>setPassword(e.target.value)}
/>

<button onClick={handleLogin}>
Login
</button>

</div>

)

}