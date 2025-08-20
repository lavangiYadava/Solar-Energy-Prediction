import React, { useState } from 'react'
import './PredictPage.css'

export default function PredictPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [visibility, setVis] = useState('')
  const [pressure, setPressure] = useState('')
  const [ceiling, setCeil] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const run = async () => {
    try {
      setLoading(true); setErr(null); setResult(null)
      const jwt = localStorage.getItem('jwt') || ''
      const res = await fetch('http://localhost:3500/forecast_information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          date,
          visibility: parseFloat(visibility),
          pressure: parseFloat(pressure),
          cloud_ceiling: parseFloat(ceiling),
        }),
      })
      if (!res.ok) throw new Error(`Server ${res.status}`)
      const data = await res.json()
      setResult(data.value)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = date && visibility && pressure && ceiling

  return (
    <div className="predict-wrap">
      <div className="panel">
        <h2>Run Prediction</h2>

        {!result && (
          <div className="rows">
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              <span>Pressure</span>
              <input type="number" step="any" value={pressure} onChange={(e) => setPressure(e.target.value)} />
            </label>
            <label>
              <span>Visibility</span>
              <input type="number" step="any" value={visibility} onChange={(e) => setVis(e.target.value)} />
            </label>
            <label>
              <span>Cloud Ceiling (m)</span>
              <input type="number" step="any" value={ceiling} onChange={(e) => setCeil(e.target.value)} />
            </label>

            <button
              className="primary"
              onClick={run}
              disabled={loading || !isFormValid}
            >
              {loading ? 'Predicting…' : 'Run Prediction'}
            </button>
          </div>
        )}

        {err && <div className="error">{err}</div>}

        {result != null && (
          <div className="result-wrap">
            <div className="stat">
              <div className="stat-label">Predicted Output</div>
              <div className="stat-value">{result}<span> W</span></div>
            </div>
            <button
              className="secondary"
              onClick={() => (window.location.href = '/home')}
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
