import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useComercio } from '../useComercio'
import { distanciaMetros, promoActual, leerCodigo } from '../utilidades'
import { IconoRegalo, IconoTarjeta, IconoUbicacion } from '../componentes/Iconos'
import MiniMapa from '../componentes/MiniMapa'
import TarjetaCliente from '../componentes/TarjetaCliente'

export default function Tarjeta() {
  const codigo = leerCodigo()
  const { comercio } = useComercio()
  const [tarjeta, setTarjeta] = useState(null)
  const [sedes, setSedes] = useState([])
  const [promos, setPromos] = useState([])
  const [cercana, setCercana] = useState(null) // sede más cercana: { sede, metros, vos }
  const [cerrada, setCerrada] = useState(null) // sede cuya notificación ya se cerró
  const [gps, setGps] = useState('Buscando tu ubicación…')
  const [simulada, setSimulada] = useState('')
  const avisados = useRef(new Set())
  const refTarjeta = useRef(null)

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

  // Busca la sede más cercana y registra el aviso si la posición está dentro de su radio
  function revisar(lat, lng) {
    let masCerca = null
    for (const s of sedes) {
      const metros = distanciaMetros(lat, lng, s.latitud, s.longitud)
      if (!masCerca || metros < masCerca.metros) masCerca = { sede: s, metros, vos: { lat, lng } }
    }
    setCercana(masCerca)
    if (masCerca && masCerca.metros <= masCerca.sede.radio_m && !avisados.current.has(masCerca.sede.id)) {
      const sedeId = masCerca.sede.id
      avisados.current.add(sedeId)
      // Supabase solo envía la consulta al usar .then o await
      supabase.rpc('registrar_aviso', { p_codigo: codigo, p_sede: sedeId, p_lat: lat, p_lng: lng })
        .then(({ error }) => { if (error) avisados.current.delete(sedeId) })
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

  // Demo: simula estar al lado de una sede
  function simular(e) {
    const id = Number(e.target.value)
    setSimulada(e.target.value)
    setCerrada(null)
    const s = sedes.find(x => x.id === id)
    if (s) { setGps(`Simulando estar en ${s.nombre}`); revisar(s.latitud + 0.0004, s.longitud) }
    else { setCercana(null) }
  }

  function verTarjeta() {
    setCerrada(cercana.sede.id)
    refTarjeta.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!codigo) {
    return (
      <div className="movil">
        <h1>Mis tarjetas</h1>
        <p>Todavía no tenés tarjeta en este celular.</p>
        <Link className="boton" to="/registro">Crear mi tarjeta</Link>
      </div>
    )
  }

  const promo = promoActual(promos)
  const dentro = cercana && cercana.metros <= cercana.sede.radio_m

  return (
    <div className="movil">
      {dentro && promo && cerrada !== cercana.sede.id && (
        <div className="notificacion" role="status">
          <div className="notificacion-origen">
            <span className="notificacion-icono"><IconoTarjeta tam={15} /></span>
            {comercio.nombre} · ahora
          </div>
          <div>
            <strong>¡Estás cerca!</strong>
            <p>{promo.mensaje}</p>
          </div>
          <button type="button" className="boton boton-marca" onClick={verTarjeta}>Ver mi tarjeta</button>
        </div>
      )}

      <h1 ref={refTarjeta}>Mis tarjetas</h1>

      <TarjetaCliente
        comercio={comercio.nombre}
        cliente={tarjeta ? `${tarjeta.nombre} ${tarjeta.apellido}` : '…'}
        sellos={tarjeta ? tarjeta.sellos : 0}
        necesarios={tarjeta ? tarjeta.necesarios : comercio.sellos_necesarios}
        premio={tarjeta?.premio || comercio.premio}
        canjes={tarjeta ? tarjeta.canjes : 0}
        qr={codigo}
        codigo={codigo}
      />

      {promo && (
        <div className="bloque promo">
          <span className="promo-icono"><IconoRegalo /></span>
          <div>
            <strong>Promo de ahora · {promo.franja}</strong>
            <p>{promo.descripcion}</p>
          </div>
        </div>
      )}

      <section className="bloque cercania">
        <h2>Aviso por cercanía</h2>
        {cercana ? (
          <>
            <MiniMapa sede={cercana.sede} radio={cercana.sede.radio_m} color={comercio.color} vos={cercana.vos} />
            <div className="distancia">
              <div>
                <strong>Estás a {Math.round(cercana.metros)} m</strong>
                <small className="gris">
                  {dentro ? 'Dentro' : 'Fuera'} del radio de {cercana.sede.radio_m} m de {cercana.sede.nombre}
                </small>
              </div>
              <span className={dentro ? 'chip-estado activo' : 'chip-estado'}>{dentro ? 'Aviso activo' : 'Fuera del radio'}</span>
            </div>
          </>
        ) : (
          <div className="distancia">
            <span className="gris" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconoUbicacion tam={18} />Todavía no tenemos tu ubicación</span>
            <span className="chip-estado">Fuera del radio</span>
          </div>
        )}
      </section>

      <div className="demo">
        <small>{gps}</small>
        <label>
          Demo: simular que estoy cerca de…
          <select className="select-discreto" value={simulada} onChange={simular}>
            <option value="">(usar mi ubicación real)</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
