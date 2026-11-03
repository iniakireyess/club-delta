import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from './supabase'
import { distanciaMetros, promoActual, leerCodigo } from './utilidades'

export default function Tarjeta() {
  const codigo = leerCodigo()
  const [tarjeta, setTarjeta] = useState(null)
  const [sedes, setSedes] = useState([])
  const [promos, setPromos] = useState([])
  const [cerca, setCerca] = useState(null)
  const [gps, setGps] = useState('Buscando tu ubicación…')
  const [simulada, setSimulada] = useState('')
  const avisados = useRef(new Set())

  // Datos de la tarjeta: se recargan cada 10 segundos para ver el sello nuevo
  useEffect(() => {
    if (!codigo) return
    async function cargar() {
      const { data } = await supabase.rpc('mi_tarjeta', { p_codigo: codigo })
      if (data && data.length) setTarjeta(data[0])
    }
    cargar()
    const t = setInterval(cargar, 10000)
    return () => clearInterval(t)
  }, [codigo])

  // Sedes y promos
  useEffect(() => {
    supabase.from('sedes').select('*').then(({ data }) => data && setSedes(data))
    supabase.from('promos').select('*').then(({ data }) => data && setPromos(data))
  }, [])

  // Revisa si una posición está dentro del radio de alguna sede
  function revisar(lat, lng) {
    let masCerca = null
    for (const s of sedes) {
      const metros = distanciaMetros(lat, lng, s.latitud, s.longitud)
      if (metros <= s.radio_m && (!masCerca || metros < masCerca.metros)) masCerca = { sede: s, metros }
    }
    setCerca(masCerca)
    if (masCerca && !avisados.current.has(masCerca.sede.id)) {
      avisados.current.add(masCerca.sede.id)
      supabase.rpc('registrar_aviso', { p_codigo: codigo, p_sede: masCerca.sede.id, p_lat: lat, p_lng: lng })
    }
  }

  // Ubicación real del celular
  useEffect(() => {
    if (!codigo || !sedes.length || simulada) return
    if (!navigator.geolocation) { setGps('Este navegador no tiene ubicación'); return }
    const id = navigator.geolocation.watchPosition(
      pos => { setGps('Ubicación activa'); revisar(pos.coords.latitude, pos.coords.longitude) },
      () => setGps('Sin permiso de ubicación'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [codigo, sedes, simulada])

  // Botón de demo: simula estar al lado de una sede
  function simular(e) {
    const id = Number(e.target.value)
    setSimulada(e.target.value)
    const s = sedes.find(x => x.id === id)
    if (s) { setGps(`Simulando estar en ${s.nombre}`); revisar(s.latitud + 0.0004, s.longitud) }
    else { setCerca(null) }
  }

  if (!codigo) {
    return (
      <div className="movil">
        <p>Todavía no tenés tarjeta en este celular.</p>
        <Link className="boton" to="/registro">Crear mi tarjeta</Link>
      </div>
    )
  }

  const promo = promoActual(promos)
  const necesarios = tarjeta ? tarjeta.necesarios : 8
  const sellos = tarjeta ? tarjeta.sellos : 0

  return (
    <div className="movil">
      {cerca && promo && (
        <div className="aviso" role="status">
          <strong>{cerca.sede.nombre} · a {Math.round(cerca.metros)} m</strong>
          <p>{promo.mensaje}</p>
        </div>
      )}

      <div className="tarjeta">
        <div className="fila">
          <strong>Restaurante Delta</strong>
          <span>{sellos} / {necesarios}</span>
        </div>
        <p className="nombre">{tarjeta ? `${tarjeta.nombre} ${tarjeta.apellido}` : '…'}</p>
        <div className="sellos">
          {Array.from({ length: necesarios }, (_, i) => (
            <span key={i} className={i < sellos ? 'sello lleno' : 'sello'} />
          ))}
        </div>
        <p>{sellos >= necesarios ? '¡Ganaste una cena para dos!' : `Te faltan ${necesarios - sellos} sellos para la cena para dos`}</p>
        {tarjeta && tarjeta.canjes > 0 && <p>Premios ganados: {tarjeta.canjes}</p>}
        <div className="qr">
          <QRCodeSVG value={codigo} size={160} />
          <small>Mostralo en caja para sumar un sello</small>
          <code className="codigo">{codigo}</code>
        </div>
      </div>

      {promo && <div className="promo"><strong>Promo de ahora · {promo.franja}</strong><p>{promo.descripcion}</p></div>}

      <div className="demo">
        <small>{gps}</small>
        <label>
          Demo: simular que estoy cerca de
          <select value={simulada} onChange={simular}>
            <option value="">(usar mi ubicación real)</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
