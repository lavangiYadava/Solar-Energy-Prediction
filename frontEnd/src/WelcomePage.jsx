import React, { useMemo, useRef, useState, useCallback } from 'react'
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api'
import { useNavigate } from 'react-router-dom'

const libraries = ['places']
const containerStyle = { width: '100%', height: '50vh', borderRadius: 12 }
const defaultCenter = { lat: 39.5, lng: -98.35 } // USA centroid-ish

export default function WelcomePage() {
  const navigate = useNavigate()

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null)     // { lat, lng }
  const [placeId, setPlaceId] = useState(null)
  const [altitude, setAltitude] = useState('')   // user-entered
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState(null)

  const autocompleteRef = useRef(null)

  const onAutoLoad = useCallback((ac) => {
    autocompleteRef.current = ac
  }, [])

  const onPlaceChanged = useCallback(() => {
    const ac = autocompleteRef.current
    if (!ac) return
    const place = ac.getPlace()
    if (!place || !place.geometry || !place.geometry.location) {
      setErr('Select a suggestion from the dropdown.')
      return
    }
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    setCoords({ lat, lng })
    setPlaceId(place.place_id || null)
    setAddress(place.formatted_address || place.name || '')
    setErr(null)
  }, [])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setErr('Geolocation not supported.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        setAddress('My current location')
        setPlaceId(null)
        setErr(null)
      },
      () => setErr('Unable to fetch your location.')
    )
  }

  const handleMapClick = (e) => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setCoords({ lat, lng })
    setErr(null)
  }

  const handleMarkerDragEnd = (e) => {
    setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }

  const canSubmit = coords && altitude !== '' && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    if (!coords) return setErr('Pick a location first.')
    if (altitude === '') return setErr('Enter altitude.')

    try {
      setSubmitting(true)
      const jwt = localStorage.getItem('jwt') || '' // if you store JWT after login

      // Adjust endpoint to your backend route if different:
      const res = await fetch('http://localhost:3500/standard_info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          address,                // string label: address
          lat: coords.lat,        // number label: lat
          lng: coords.lng,        // number label: lng
          altitude_m: Number(altitude), // number label: altitude_m
          place_id: placeId,      // string label: place_id
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Server ${res.status}: ${detail || 'failed'}`)
      }

      // Optionally read response
      // const data = await res.json()

      // Go to homepage after saving
      navigate('/home', { replace: true })
    } catch (e) {
      console.error(e)
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const mapCenter = useMemo(() => coords || defaultCenter, [coords])

  if (loadError) return <div>Failed to load Google Maps: {String(loadError)}</div>
  if (!isLoaded) return <div>Loading map…</div>

  return (
    <div style={{ maxWidth: 920, margin: '24px auto', padding: 16 }}>
      <h1>Welcome! 🎉</h1>
      <p>Search your address, confirm on the map, and enter your site altitude.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
            <input
              placeholder="Search address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </Autocomplete>
          <button type="button" onClick={useMyLocation} style={{ padding: '10px 12px', borderRadius: 8 }}>
            Use my location
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={coords ? 14 : 4}
          onClick={handleMapClick}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {coords && (
            <Marker
              position={coords}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ minWidth: 90 }}>Altitude (m)</label>
          <input
            type="number"
            inputMode="decimal"
            value={altitude}
            onChange={(e) => setAltitude(e.target.value)}
            placeholder="e.g., 250"
            style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>

        {coords && (
          <small style={{ color: '#555' }}>
            Selected: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} {placeId ? `(place_id: ${placeId})` : ''}
          </small>
        )}

        {err && <div style={{ color: 'crimson' }}>{err}</div>}

        <div>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: canSubmit ? '#2563eb' : '#9ca3af',
              color: 'white',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  )
}
