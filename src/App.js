import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { io } from 'socket.io-client'

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN

export default function App() {
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const [data, setData] = useState({
    speed: 0,
    delta: 0
  })

  // 🎨 cor do delta
  const getDeltaColor = (delta) => {
    if (delta < 0) return '#00FF85' // mais rápido
    if (delta > 0) return '#FF3B3B' // mais lento
    return '#999'
  }

  // 📏 tamanho da barra
  const getDeltaWidth = (delta) => {
    const max = 5 // limite visual (ajuste conforme sua telemetria)
    const normalized = Math.min(Math.abs(delta), max)
    return `${(normalized / max) * 100}%`
  }

  useEffect(() => {
    // 🗺️ mapa
    mapRef.current = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-47.8999, -15.7727],
      zoom: 16,
    })

    // 📍 marker
    markerRef.current = new mapboxgl.Marker({
      color: '#9C4DFF',
    })
      .setLngLat([-47.8999, -15.7727])
      .addTo(mapRef.current)

    // 🔌 websocket
    const socket = io(process.env.REACT_APP_TELEMETRY_URL, {
      transports: ['websocket'],
      query: {
        type: 'dashboard',
        raceId: '1',
      },
    })

    socket.on('connect', () => {
      console.log('✅ conectado')
    })

    socket.on('telemetry', (telemetry) => {
      // atualiza UI
      setData({
        speed: telemetry.speed || 0,
        delta: telemetry.delta || 0
      })

      // move marker
      if (markerRef.current) {
        markerRef.current.setLngLat([telemetry.lng, telemetry.lat])
      }
    })

    return () => {
      socket.disconnect()
      mapRef.current?.remove()
    }
  }, [])

  return (
    <div
      id="map"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
      }}
    >
      {/* 📊 DASHBOARD */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 5000,
      }}>

        {/* 🚗 VELOCIDADE */}
        <div style={{
          width: 240,
          height: 110,
          background: 'rgba(0,0,0,0.85)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: '#fff',
          backdropFilter: 'blur(6px)'
        }}>
          <span style={{ fontSize: 13, opacity: 0.6 }}>VELOCIDADE</span>
          <span style={{ fontSize: 32, fontWeight: 'bold' }}>
            {data.speed} km/h
          </span>
        </div>

        {/* ⏱️ DELTA */}
        <div style={{
          width: 240,
          height: 110,
          background: 'rgba(0,0,0,0.85)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
          backdropFilter: 'blur(6px)'
        }}>
          <span style={{ fontSize: 13, opacity: 0.6 }}>DELTA</span>

          <span style={{
            fontSize: 26,
            fontWeight: 'bold',
            color: getDeltaColor(data.delta)
          }}>
            {data.delta > 0 ? '+' : ''}{data.delta.toFixed(2)}s
          </span>

          {/* 🔥 barra */}
          <div style={{
            width: '100%',
            height: 10,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <div style={{
              width: getDeltaWidth(data.delta),
              height: '100%',
              background: getDeltaColor(data.delta),
              transition: 'all 0.25s ease'
            }} />
          </div>
        </div>

      </div>
    </div>
  )
}
