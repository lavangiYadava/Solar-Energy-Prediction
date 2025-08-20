import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'

export default function SignIn() {
  const navigate = useNavigate()

  return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <h2>Sign In</h2>

        <GoogleLogin
          onSuccess={async ({ credential }) => {
            try {
              if (!credential) return alert('No Google credential received')

              // Call your backend. If you added a Vite proxy, this hits http://localhost:<PORT>/api/login
              const res = await fetch("http://localhost:3500/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: credential }),
});
              if (!res.ok) throw new Error(`Server responded ${res.status}`)
              const data = await res.json()

              // Store what you need
              if (data.token) localStorage.setItem('jwt', data.token)
              if (data.username) localStorage.setItem('username', data.username)

              // Support either shape your backend returns:
              // A) { status: "login" | "signup" }
              // B) { status_code: 0 | 1 }
              const status = data.status ?? (data.status_code === 0 ? 'login' : data.status_code === 1 ? 'signup' : undefined)

              if (status === 'login') {
                navigate('/home', { replace: true })
              } else if (status === 'signup') {
                navigate('/welcome', { replace: true })
              } else {
                console.error('Unexpected response:', data)
                alert('Unexpected server response.')
              }
            } catch (err) {
              console.error('Login error:', err)
              alert('Login failed.')
            }
          }}
          onError={() => alert('Google Sign-In failed')}
        />
      </div>
    </div>
  )
}
