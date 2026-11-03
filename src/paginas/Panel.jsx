import { useEffect, useMemo, useState } from 'react'
import { HeatmapLayer, ScatterplotLayer } from 'deck.gl'
import { Map } from 'react-map-gl/maplibre'
import { DeckGLOverlay, ESTILO_MAPA } from '../mapa'
import { supabase } from '../supabase'
import { useComercio } from '../useComercio'
import { COLORES_FRANJA, hexARgb, tiempoRelativo } from '../utilidades'
import Encabezado from '../componentes/Encabezado'
import { IconoMas, IconoMenos } from '../componentes/Iconos'

// En pantallas angostas hace falta menos zoom para que entren las 6 sedes
const VISTA_INICIAL = { longitude: -58.635, latitude: -34.452, zoom: window.innerWidth < 700 ? 10.2 : 11 }
const FILTROS = ['Todas', 'Desayuno', 'Merienda', 'Cena']
const CAPAS = [
  { id: 'sedes', texto: 'Sedes' },
  { id: 'radio', texto: 'Radio del aviso' },
  { id: 'calor', texto: 'Mapa de calor' }
]
const GRIS = [120, 120, 120]
// Mayor que el punto más grande de una sede (8 + 61 / 4 = 23 px) para que el anillo se vea siempre
const ANILLO_MINIMO_PX = 30

const rgbFranja = franja => (COLORES_FRANJA[franja] ? hexARgb(COLORES_FRANJA[franja]) : GRIS)

const escapar = texto => String(texto ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

function tooltipSede({ object: s }) {
  if (!s) return null
  return {
    html: `<b>${escapar(s.nombre)}</b><br/>Zona: ${escapar(s.zona)}<br/>Franja más fuerte: ${escapar(s.categoria)}<br/>Clientes: ${escapar(s.valor)}<br/>Sellos del mes: ${escapar(s.sellos_mes)}<br/>Avisos del mes: ${escapar(s.avisos_mes)}<br/>Radio del aviso: ${escapar(s.radio_m)} m`,
    style: { background: '#16181D', color: '#fff', borderRadius: '12px', padding: '10px 12px', fontSize: '13px', fontFamily: 'Manrope, system-ui, sans-serif' }
  }
}

export default function Panel() {
  const { comercio } = useComercio()
  const [sedes, setSedes] = useState([])
  const [kpi, setKpi] = useState(null)
  const [avisos, setAvisos] = useState([])
  const [ultimos, setUltimos] = useState([])
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('Todas')
  const [capas, setCapas] = useState({ sedes: true, radio: true, calor: false })
  const [vista, setVista] = useState(VISTA_INICIAL)

  useEffect(() => {
    async function cargar() {
      const [s, k, a, u] = await Promise.all([
        supabase.from('resumen_sedes').select('*'),
        supabase.from('indicadores').select('*').single(),
        supabase.from('avisos_recientes').select('*'),
        supabase.from('ultimos_avisos').select('*')
      ])
      const fallo = [s, k, a, u].find(r => r.error)
      setError(fallo ? fallo.error.message : null)
      if (!s.error) setSedes(s.data)
      if (!k.error) setKpi(k.data)
      if (!a.error) setAvisos(a.data)
      if (!u.error) setUltimos(u.data)
    }
    cargar()
    const intervalo = setInterval(cargar, 15000)
    return () => clearInterval(intervalo)
  }, [])

  const masAvisos = sedes.reduce((a, b) => (!a || b.avisos_mes > a.avisos_mes ? b : a), null)
  const ranking = useMemo(() => [...sedes].sort((a, b) => b.valor - a.valor), [sedes])
  const avisosFiltrados = useMemo(
    () => (filtro === 'Todas' ? avisos : avisos.filter(a => a.franja === filtro)),
    [avisos, filtro]
  )

  const marca = hexARgb(comercio.color)
  const layers = [
    capas.calor && new HeatmapLayer({
      id: 'calor',
      data: avisosFiltrados,
      getPosition: d => [d.longitud, d.latitud],
      getWeight: 1,
      radiusPixels: 45
    }),
    capas.radio && new ScatterplotLayer({
      id: 'radios',
      data: sedes,
      getPosition: d => [d.longitud, d.latitud],
      getRadius: d => d.radio_m,
      radiusUnits: 'meters',
      radiusMinPixels: ANILLO_MINIMO_PX,
      stroked: true,
      getFillColor: [...marca, 25],
      getLineColor: marca,
      lineWidthUnits: 'pixels',
      getLineWidth: 1.5
    }),
    new ScatterplotLayer({
      id: 'avisos',
      data: avisosFiltrados,
      getPosition: d => [d.longitud, d.latitud],
      getRadius: 4,
      radiusUnits: 'pixels',
      getFillColor: d => [...rgbFranja(d.franja), 180]
    }),
    capas.sedes && new ScatterplotLayer({
      id: 'sedes',
      data: sedes,
      pickable: true,
      getPosition: d => [d.longitud, d.latitud],
      getRadius: d => 8 + d.valor / 4,
      radiusUnits: 'pixels',
      getFillColor: d => rgbFranja(d.categoria),
      stroked: true,
      getLineColor: [255, 255, 255],
      lineWidthUnits: 'pixels',
      getLineWidth: 2
    })
  ]

  const zoom = cambio => setVista(v => ({ ...v, zoom: Math.min(18, Math.max(3, v.zoom + cambio)) }))

  return (
    <>
      <Encabezado comercio={comercio} />
      <main className="pagina">
        <div className="titulo-panel">
          <div>
            <h1>Mapa del Club de Fidelidad</h1>
            <p className="subtitulo">Sedes de {comercio.nombre} en Tigre · ¿Qué sede fideliza mejor y en qué franja?</p>
          </div>
          <div className="opciones" role="group" aria-label="Filtrar avisos por franja">
            {FILTROS.map(f => (
              <button key={f} type="button" className="opcion" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>{f}</button>
            ))}
          </div>
        </div>

        {error && <p className="error">Error al leer Supabase: {error}</p>}

        <section className="indicadores">
          <div className="bloque indicador">
            <span>Clientes en el club</span>
            <strong>{kpi ? kpi.clientes : '…'}</strong>
          </div>
          <div className="bloque indicador">
            <span>Sellos en el último mes</span>
            <strong>{kpi ? kpi.sellos_mes : '…'}</strong>
          </div>
          <div className="bloque indicador">
            <span>Avisos por cercanía (último mes)</span>
            <strong>{kpi ? kpi.avisos_mes : '…'}</strong>
            <small className="gris">{masAvisos ? `Más avisos: ${masAvisos.nombre}` : ''}</small>
          </div>
        </section>

        <div className="columnas">
          <section className="bloque columna-mapa">
            <div className="mapa-cabecera">
              <h2>Mapa interactivo · deck.gl</h2>
              <div className="opciones" role="group" aria-label="Capas del mapa">
                {CAPAS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="opcion"
                    aria-pressed={capas[c.id]}
                    onClick={() => setCapas({ ...capas, [c.id]: !capas[c.id] })}
                  >
                    {c.texto}
                  </button>
                ))}
              </div>
            </div>
            <div className="mapa">
              <Map
                {...vista}
                onMove={e => setVista(e.viewState)}
                mapStyle={ESTILO_MAPA}
                attributionControl={{ compact: true }}
                style={{ width: '100%', height: '100%' }}
              >
                <DeckGLOverlay layers={layers} getTooltip={tooltipSede} />
              </Map>
              <div className="zoom">
                <button type="button" aria-label="Acercar" onClick={() => zoom(1)}><IconoMas /></button>
                <button type="button" aria-label="Alejar" onClick={() => zoom(-1)}><IconoMenos /></button>
              </div>
              <div className="leyenda">
                {Object.entries(COLORES_FRANJA).map(([franja, color]) => (
                  <span key={franja}><i className="punto" style={{ background: color }} />{franja}</span>
                ))}
                <span>Tamaño = clientes · Anillo = radio del aviso · Puntitos = avisos</span>
              </div>
            </div>
          </section>

          <aside className="columna-lateral">
            <section className="bloque">
              <h2>Sedes con más clientes</h2>
              <ul className="lista">
                {ranking.map(s => (
                  <li key={s.id} className="fila-sede">
                    <i className="punto" style={{ background: COLORES_FRANJA[s.categoria] || '#787878' }} />
                    <div>{s.nombre}<small>{s.zona}</small></div>
                    <strong>{s.valor}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bloque">
              <h2>Últimos avisos por cercanía</h2>
              <p className="gris" style={{ margin: '4px 0 0' }}>Clientes que entraron en el radio de una sede</p>
              <ul className="lista">
                {ultimos.map(a => (
                  <li key={a.id}>
                    <p className="aviso-texto">{a.cliente} → {a.sede}</p>
                    <small className="gris">{tiempoRelativo(a.fecha_hora)} · {Math.round(a.metros)} m del local</small>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </>
  )
}
