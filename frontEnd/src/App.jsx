// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './SignIn.jsx'
import HomePage from './HomePage.jsx'
import WelcomePage from './WelcomePage.jsx'
import OnboardingComplete from './OnboardingComplete.jsx'
import ProfilePage from './ProfilePage.jsx'
import SettingsPage from './SettingsPage.jsx'
import PredictPage from './PredictPage.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('jwt')
  return token ? children : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/welcome" element={<RequireAuth><WelcomePage /></RequireAuth>} />
      <Route path="/welcome/done" element={<RequireAuth><OnboardingComplete /></RequireAuth>} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/predict" element={<RequireAuth><PredictPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}
