import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// El rol anon solo puede leer estas columnas de comercios: pedir * da "permission denied"
const COLUMNAS = 'id, nombre, color, logo_url, premio, sellos_necesarios'
const VIOLETA = '#4A2FD9'
const POR_DEFECTO = { nombre: 'Restaurante Delta', color: VIOLETA, premio: 'Cena para dos', sellos_necesarios: 8 }

let ultimo = null

function aplicarMarca(color) {
  const raiz = document.documentElement.style
  raiz.setProperty('--marca', color)
  if (color.toUpperCase() === VIOLETA) {
    raiz.removeProperty('--marca-suave')
    raiz.removeProperty('--marca-texto')
  } else {
    raiz.setProperty('--marca-suave', `color-mix(in srgb, ${color} 10%, white)`)
    raiz.setProperty('--marca-texto', `color-mix(in srgb, ${color} 75%, black)`)
  }
}

// Lee el comercio y aplica su color a toda la app
export function useComercio() {
  const [comercio, setComercio] = useState(ultimo || POR_DEFECTO)

  const recargar = useCallback(async () => {
    const { data } = await supabase.from('comercios').select(COLUMNAS).order('id').limit(1).maybeSingle()
    if (!data) return
    ultimo = data
    aplicarMarca(data.color)
    setComercio(data)
  }, [])

  useEffect(() => { recargar() }, [recargar])

  return { comercio, recargar }
}
