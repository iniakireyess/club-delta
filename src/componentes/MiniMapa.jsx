import { ScatterplotLayer } from 'deck.gl'
import { Map, Marker } from 'react-map-gl/maplibre'
import { DeckGLOverlay, ESTILO_MAPA } from '../mapa'
import { distanciaMetros, hexARgb } from '../utilidades'

const ALTO = 200
const AZUL_VOS = [28, 126, 214]

// Zoom para que "metros" entren sin llegar a los créditos del borde inferior
function zoomPara(metros, latitud) {
  const metrosPorPixelZoom0 = 78271.5 * Math.cos((latitud * Math.PI) / 180)
  return Math.max(8, Math.min(18, Math.log2((metrosPorPixelZoom0 * (ALTO * 0.3)) / metros)))
}

// Mapa chico, no interactivo: la sede, su anillo en metros y (opcional) el punto "Vos"
export default function MiniMapa({ sede, radio, color, vos }) {
  const posicion = [sede.longitud, sede.latitud]
  const distancia = vos ? distanciaMetros(vos.lat, vos.lng, sede.latitud, sede.longitud) : 0
  const rgb = hexARgb(color)

  const layers = [
    new ScatterplotLayer({
      id: 'mini-anillo',
      data: [sede],
      getPosition: () => posicion,
      getRadius: radio,
      radiusUnits: 'meters',
      stroked: true,
      getFillColor: [...rgb, 25],
      getLineColor: rgb,
      lineWidthUnits: 'pixels',
      getLineWidth: 1.5,
      updateTriggers: { getRadius: radio, getPosition: sede.id }
    }),
    new ScatterplotLayer({
      id: 'mini-sede',
      data: [sede],
      getPosition: () => posicion,
      getRadius: 7,
      radiusUnits: 'pixels',
      stroked: true,
      getFillColor: rgb,
      getLineColor: [255, 255, 255],
      lineWidthUnits: 'pixels',
      getLineWidth: 2,
      updateTriggers: { getPosition: sede.id }
    }),
    vos && new ScatterplotLayer({
      id: 'mini-vos',
      data: [vos],
      getPosition: d => [d.lng, d.lat],
      getRadius: 7,
      radiusUnits: 'pixels',
      stroked: true,
      getFillColor: AZUL_VOS,
      getLineColor: [255, 255, 255],
      lineWidthUnits: 'pixels',
      getLineWidth: 2,
      updateTriggers: { getPosition: `${vos.lat},${vos.lng}` }
    })
  ]

  return (
    <div className="mini-mapa" style={{ height: ALTO }}>
      <Map
        longitude={sede.longitud}
        latitude={sede.latitud}
        zoom={zoomPara(Math.max(radio, distancia * 1.1), sede.latitud)}
        mapStyle={ESTILO_MAPA}
        interactive={false}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} />
        {vos && (
          <Marker longitude={vos.lng} latitude={vos.lat} anchor="bottom" offset={[0, -9]}>
            <span className="etiqueta-vos">Vos</span>
          </Marker>
        )}
      </Map>
    </div>
  )
}
