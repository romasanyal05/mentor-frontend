"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [isSignup,setIsSignup] = useState(false)

  const handleAuth = async ()=>{

    if(isSignup){
      const { error } = await supabase.auth.signUp({
        email,
        password
      })

      if(error) alert(error.message)
      else alert("Signup success")
    }
    else{
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if(error){
        alert(error.message)
      } else {
        // 🔥 FINAL FIX
        router.push("/editor?session=test123")
      }
    }

  }

  return(
    <div style={{
      height:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center"
    }}>

      <div style={{
        padding:"20px",
        border:"1px solid gray",
        borderRadius:"10px"
      }}>

        <h2>{isSignup ? "Signup" : "Login"}</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <br/><br/>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <br/><br/>

        <button onClick={handleAuth}>
          {isSignup ? "Signup" : "Login"}
        </button>

        <br/><br/>

        <button onClick={()=>setIsSignup(!isSignup)}>
          {isSignup ? "Go to Login" : "Go to Signup"}
        </button>

      </div>

    </div>
  )
}