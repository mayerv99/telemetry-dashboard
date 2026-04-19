import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { io } from 'socket.io-client'

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN

export default function App() {
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    console.log('🔥 effect rodou')
    // 🗺️ cria mapa
    mapRef.current = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-47.8999, -15.7727],
      zoom: 16,
    })

    // 📍 cria marker inicial
    markerRef.current = new mapboxgl.Marker({
      color: '#9C4DFF',
    })
      .setLngLat([-47.8999, -15.7727])
      .addTo(mapRef.current)

    console.log("url", process.env)

    // 🔌 conecta websocket
    const socket = io(process.env.REACT_APP_TELEMETRY_URL, {
      transports: ['websocket'],
      query: {
        type: 'dashboard',
        raceId: '1',
      },
    })

    socket.on('connect', () => {
      console.log('✅ conectado ao websocket')
    })

    socket.on('telemetry', (data) => {
      console.log('📡 update recebido:', data)
      console.log('📍 posição atual:', data)

      // 🔥 move o marker (SEM recriar)
      if (markerRef.current) {
        markerRef.current.setLngLat([data.lng, data.lat])
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
      }}
    />
  )
}
