import { MapboxOverlay } from '@deck.gl/mapbox'
import { useControl } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'

// Vite mueve los archivos al empaquetar: sin esto MapLibre no encuentra su worker y no dibuja las calles
setWorkerUrl(maplibreWorkerUrl)

export const ESTILO_MAPA = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// Dibuja las capas de deck.gl encima del mapa de MapLibre
export function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}
