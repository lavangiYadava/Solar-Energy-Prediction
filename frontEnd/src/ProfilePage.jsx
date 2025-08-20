import React, { useEffect, useMemo, useState } from 'react'
import './ProfilePage.css'

export default function ProfilePage() {
  const [me, setMe] = useState(null) // { username, email, site: { lat, lng, altitude_m } }
  const [loadingMe, setLoadingMe] = useState(true)
  const [errMe, setErrMe] = useState(null)

  const [week, setWeek] = useState([]) // [{dateISO, label}] Mon..Sun (or today + 6)
  const [preds, setPreds] = useState([]) // numbers length 7
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [errWeek, setErrWeek] = useState(null)

  // you can choose how to define “week”. Here: today → next 6 days
  useEffect(() => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dateISO = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      days.push({ dateISO, label })
    }
    setWeek(days)
  }, [])

  // load current user + saved site (adjust endpoint to your backend)
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingMe(true)
        setErrMe(null)
        const jwt = localStorage.getItem('jwt') || ''
        const res = await fetch('http://localhost:3500/api/user/me', {
          headers: {
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          },
        })
        if (!res.ok) throw new Error(`Server ${res.status}`)
        const data = await res.json()
        // expected shape:
        // { username, email, site: { lat, lng, altitude_m } }
        setMe(data)
      } catch (e) {
        setErrMe(e.message)
      } finally {
        setLoadingMe(false)
      }
    }
    run()
  }, [])

  const canPredict = useMemo(() => {
    return me?.site?.lat != null && me?.site?.lng != null && me?.site?.altitude_m != null
  }, [me])

  const fetchWeek = async () => {
    if (!canPredict) { setErrWeek('Missing site info.'); return }
    try {
      setLoadingWeek(true)
      setErrWeek(null)
      const jwt = localStorage.getItem('jwt') || ''
      const body = {
        lat: Number(me.site.lat),
        lng: Number(me.site.lng),
        altitude_m: Number(me.site.altitude_m),
        start_date: week[0].dateISO, // ISO yyyy-mm-dd
      }
      const res = await fetch('http://localhost:3500/api/predict/week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Server ${res.status}`)
      const data = await res.json()
      // expect { predictions: [n1, n2, ..., n7] }
      setPreds(Array.isArray(data.predictions) ? data.predictions : [])
    } catch (e) {
      setErrWeek(e.message)
      setPreds([])
    } finally {
      setLoadingWeek(false)
    }
  }

  return (
    <div className="profile-wrap">
      <h1>Profile</h1>

      <section className="cards">
        <div className="card">
          <div className="card-title">User</div>
          {loadingMe ? (
            <div className="muted">Loading…</div>
          ) : errMe ? (
            <div className="error">{errMe}</div>
          ) : me ? (
            <ul className="kv">
              <li><span>Name</span><b>{me.username}</b></li>
              <li><span>Email</span><b>{me.email}</b></li>
            </ul>
          ) : (
            <div className="muted">No user data.</div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Site</div>
          {loadingMe ? (
            <div className="muted">Loading…</div>
          ) : me?.site ? (
            <ul className="kv">
              <li><span>Latitude</span><b>{Number(me.site.lat).toFixed(5)}</b></li>
              <li><span>Longitude</span><b>{Number(me.site.lng).toFixed(5)}</b></li>
              <li><span>Altitude (m)</span><b>{Number(me.site.altitude_m).toFixed(1)}</b></li>
            </ul>
          ) : (
            <div className="muted">No site set. Add one in Welcome/Settings.</div>
          )}
        </div>
      </section>

      <section className="week">
        <div className="week-head">
          <h2>Weekly Predictions</h2>
          <div className="actions">
            <button className="ghost" onClick={fetchWeek} disabled={!canPredict || loadingWeek}>
              {loadingWeek ? 'Fetching…' : 'Load this week'}
            </button>
          </div>
        </div>

        {errWeek && <div className="error">{errWeek}</div>}

        <div className="week-grid">
          {week.map((d, i) => {
            const val = preds[i]
            return (
              <div className="day-card" key={d.dateISO}>
                <div className="day-label">{d.label}</div>
                <div className="pred-box">
                  {val == null ? <span className="muted">—</span> : <span className="pred">{val}</span>}
                  <div className="unit">W</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
