import { GoogleMap, StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { useRef, useState } from 'react';

export default function LocationPage() {
  const inputRef = useRef(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [altitude, setAltitude] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyD5Zc2qEiZ1a9ELQh9vi5Ud38fJ61AcE9A',
    libraries: ['places'],
  });

  const handlePlacesChanged = () => {
    const places = inputRef.current.getPlaces();
    if (places && places.length > 0) {
      const location = places[0].geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      setCoordinates({ lat, lng });
      console.log('Latitude:', lat);
      console.log('Longitude:', lng);
    }
  };

  const handleSubmit = () => {
    console.log('Final submission:');
    console.log('Latitude:', coordinates.lat);
    console.log('Longitude:', coordinates.lng);
    console.log('Altitude:', altitude);

    // Optional: send to backend
    fetch('http://localhost:3500/standard_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        altitude: parseFloat(altitude),
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log('Saved:', data))
      .catch((err) => console.error('Error:', err));
  };

  return (
    <div style={{ marginTop: '5%', textAlign: 'center' }}>
      {isLoaded && (
        <StandaloneSearchBox
          onLoad={(ref) => (inputRef.current = ref)}
          onPlacesChanged={handlePlacesChanged}
        >
          <input
            type="text"
            placeholder="Type address here"
            style={{
              boxSizing: 'border-box',
              border: '1px solid transparent',
              width: '60%',
              height: '45px',
              padding: '0 12px',
              borderRadius: '5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              fontSize: '16px',
              outline: 'none',
              textOverflow: 'ellipsis',
              marginBottom: '1rem',
            }}
          />
        </StandaloneSearchBox>
      )}

      <br />
      <input
        type="number"
        placeholder="enter altitude in feet"
        value={altitude}
        onChange={(e) => setAltitude(e.target.value)}
        style={{
          padding: '0.5rem',
          fontSize: '16px',
          width: '250px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          marginBottom: '1rem',
        }}
      />
      <br />
      <button
        onClick={handleSubmit}
        style={{
          padding: '0.5rem 1.2rem',
          fontSize: '16px',
          borderRadius: '5px',
          backgroundColor: '#007BFF',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Submit Location Info
      </button>
    </div>
  );
}
