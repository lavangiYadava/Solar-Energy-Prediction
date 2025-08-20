import React from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'friend'

  const goProfile = () => navigate('/profile')
  const goSettings = () => navigate('/settings')
  const goPredict = () => navigate('/predict')

  const signOut = () => {
    localStorage.removeItem('jwt')
    localStorage.removeItem('username')
    navigate('/signin', { replace: true })
  }

  return (
    <div className="home-wrap">
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <span className="logo-dot" />
          <span>Solar Energy Predictor</span>
        </div>
        <div className="user">
          <span className="hello">Hi, {username}</span>
          <button className="ghost" onClick={signOut} aria-label="Sign out">Sign out</button>
        </div>
      </header>

      {/* Main content */}
      <main className="grid">
        {/* Side actions */}
        <section className="side">
          <button className="card" onClick={goProfile} aria-label="Edit profile">
            <div className="card-icon" aria-hidden>
              {/* user icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <div className="card-title">Profile</div>
            <div className="card-sub">Update your name, email, photo</div>
          </button>

          <button className="card" onClick={goSettings} aria-label="Open settings">
            <div className="card-icon" aria-hidden>
              {/* gear icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.3-2.6H9.5L9.2 6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 4.9 12c0 .3 0 .7.1 1l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.3 2.6h3.9l.3-2.6c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
              </svg>
            </div>
            <div className="card-title">Settings</div>
            <div className="card-sub">Manage site & app preferences</div>
          </button>
        </section>

        {/* Center call-to-action */}
        <section className="center">
          <div className="cta">
            <h1>Ready to predict?</h1>
            <p>Use your saved site to forecast solar generation for the next day or week.</p>
            <button className="primary-cta" onClick={goPredict}>
              <span>Run Prediction</span>
              {/* arrow */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
