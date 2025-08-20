import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingComplete() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h1>All set! ✅</h1>
      <p>Your site information has been saved.</p>
      <p>Redirecting you to your home screen...</p>
    </div>
  )
}
