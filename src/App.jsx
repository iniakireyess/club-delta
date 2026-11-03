import { useEffect, useState } from 'react'
import { ScatterplotLayer } from 'deck.gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { Map, useControl } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase } from './supabase'
import './App.css'

// Vite mueve los archivos al empaquetar: sin esto MapLibre no encuentra su worker y no dibuja las calles
setWorkerUrl(maplibreWorkerUrl)

const COLORES = { Desayuno: [232, 89, 12], Merienda: [194, 37, 92], Cena: [74, 47, 217] }
const VISTA_INICIAL = { longitude: -58.62, latitude: -34.44, zoom: 11.3 }
const MAPA = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// Dibuja las capas de deck.gl encima del mapa de MapLibre
function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}

export default function App() {
  const [sedes, setSedes] = useState([])
  const [kpi, setKpi] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data: s, error: e1 } = await supabase.from('resumen_sedes').select('*')
      const { data: k, error: e2 } = await supabase.from('indicadores').select('*').single()
      console.log('Sedes:', s, 'Indicadores:', k)
      if (e1 || e2) { setError((e1 || e2).message); return }
      setSedes(s)
      setKpi(k)
    }
    cargar()
  }, [])

  const masAvisos = sedes.reduce((a, b) => (!a || b.avisos_mes > a.avisos_mes ? b : a), null)

  const layers = [
    // Círculo con el radio del aviso de cada sede (en metros)
    new ScatterplotLayer({
      id: 'radios',
      data: sedes,
      getPosition: d => [d.longitud, d.latitud],
      getRadius: d => d.radio_m,
      radiusUnits: 'meters',
      stroked: true,
      getFillColor: [11, 110, 92, 30],
      getLineColor: [11, 110, 92, 200],
      lineWidthMinPixels: 1.5
    }),
    // Un punto por sede: tamaño = clientes, color = franja más fuerte
    new ScatterplotLayer({
      id: 'sedes',
      data: sedes,
      pickable: true,
      getPosition: d => [d.longitud, d.latitud],
      getRadius: d => 6 + d.valor / 4,
      radiusUnits: 'pixels',
      getFillColor: d => COLORES[d.categoria] || [120, 120, 120],
      stroked: true,
      getLineColor: [255, 255, 255],
      lineWidthMinPixels: 2
    })
  ]

  return (
    <div className="app">
      <header className="encabezado">
        <h1>Club de Fidelidad · Restaurante Delta</h1>
        <p>Sedes en Tigre · ¿Qué sede fideliza mejor y en qué franja?</p>
      </header>

      {error && <p className="error">Error al leer Supabase: {error}</p>}

      <section className="kpis">
        <div className="kpi">
          <span>Clientes en el club</span>
          <strong>{kpi ? kpi.clientes : '…'}</strong>
        </div>
        <div className="kpi">
          <span>Sellos en el último mes</span>
          <strong>{kpi ? kpi.sellos_mes : '…'}</strong>
        </div>
        <div className="kpi">
          <span>Avisos por cercanía (último mes)</span>
          <strong>{kpi ? kpi.avisos_mes : '…'}</strong>
          <small>{masAvisos ? `Más avisos: ${masAvisos.nombre}` : ''}</small>
        </div>
      </section>

      <section className="mapa">
        <Map
          initialViewState={VISTA_INICIAL}
          mapStyle={MAPA}
          style={{ width: '100%', height: '100%' }}
        >
          <DeckGLOverlay
            layers={layers}
            getTooltip={({ object }) => object && {
              html: `<b>${object.nombre}</b><br/>Zona: ${object.zona}<br/>Franja más fuerte: ${object.categoria}<br/>Clientes: ${object.valor}<br/>Sellos del mes: ${object.sellos_mes}<br/>Avisos del mes: ${object.avisos_mes}`,
              style: { background: '#16181D', color: '#fff', borderRadius: '10px', padding: '10px 12px', fontSize: '13px' }
            }}
          />
        </Map>
        <div className="leyenda">
          {Object.entries(COLORES).map(([franja, c]) => (
            <span key={franja}>
              <i className="punto" style={{ background: `rgb(${c.join(',')})` }} />{franja}
            </span>
          ))}
          <span>Tamaño = clientes · Círculo = radio del aviso</span>
        </div>
      </section>
    </div>
  )
}