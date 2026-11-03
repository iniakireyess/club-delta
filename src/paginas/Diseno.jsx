import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useComercio } from '../useComercio'
import Encabezado from '../componentes/Encabezado'
import MiniMapa from '../componentes/MiniMapa'
import TarjetaCliente from '../componentes/TarjetaCliente'

const CANTIDADES = [4, 5, 6, 8, 10]
const COLORES = ['#4A2FD9', '#16181D', '#0B8A73', '#C2255C', '#E8590C', '#1C7ED6']
const FRANJAS = ['Desayuno', 'Merienda', 'Cena', 'Fuera de horario']

// Las funciones de guardado informan algunos fallos como texto (por ejemplo "PIN incorrecto"), no como error
const FALLO_EN_TEXTO = /incorrect|invalid|inválid|error|no existe|no se|debe/i
const salioBien = (error, data) => !error && !FALLO_EN_TEXTO.test(String(data ?? ''))

export default function Diseno() {
  const { comercio, recargar } = useComercio()
  const [form, setForm] = useState({ nombre: '', premio: '', sellos: 8, color: COLORES[0] })
  const [sedes, setSedes] = useState([])
  const [sedeId, setSedeId] = useState('')
  const [radios, setRadios] = useState({})
  const [radiosGuardados, setRadiosGuardados] = useState({})
  const [promos, setPromos] = useState({})
  const [promosGuardadas, setPromosGuardadas] = useState({})
  const [pin, setPin] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    if (comercio.id) setForm({ nombre: comercio.nombre, premio: comercio.premio, sellos: comercio.sellos_necesarios, color: comercio.color })
  }, [comercio])

  useEffect(() => {
    supabase.from('sedes').select('id, nombre, latitud, longitud, radio_m').then(({ data }) => {
      if (!data || !data.length) return
      const iniciales = Object.fromEntries(data.map(s => [s.id, s.radio_m]))
      setSedes(data)
      setSedeId(String(data[0].id))
      setRadios(iniciales)
      setRadiosGuardados(iniciales)
    })
    supabase.from('promos').select('franja, descripcion, mensaje').then(({ data }) => {
      if (!data) return
      const porFranja = Object.fromEntries(data.map(p => [p.franja, { descripcion: p.descripcion, mensaje: p.mensaje }]))
      setPromos(porFranja)
      setPromosGuardadas(porFranja)
    })
  }, [])

  const cambiar = e => setForm({ ...form, [e.target.name]: e.target.value })
  const cambiarPromo = (franja, campo, valor) => setPromos({ ...promos, [franja]: { ...promos[franja], [campo]: valor } })

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setResultados([])
    const nuevos = []
    const anotar = (titulo, { data, error }) => {
      const bien = salioBien(error, data)
      nuevos.push({ titulo, texto: error ? error.message : String(data ?? 'Guardado'), bien })
      setResultados([...nuevos])
      return bien
    }

    const diseno = await supabase.rpc('guardar_diseno', {
      p_pin: pin, p_nombre: form.nombre, p_color: form.color, p_premio: form.premio, p_sellos: Number(form.sellos)
    })
    // Si el diseño falla (por ejemplo, PIN incorrecto) no se intenta guardar el resto
    if (anotar('Tarjeta', diseno)) {
      await recargar()

      const radiosNuevos = { ...radiosGuardados }
      for (const s of sedes) {
        if (radios[s.id] === radiosGuardados[s.id]) continue
        const r = await supabase.rpc('guardar_radio', { p_pin: pin, p_sede: s.id, p_radio: radios[s.id] })
        if (anotar(`Radio de ${s.nombre}`, r)) radiosNuevos[s.id] = radios[s.id]
      }
      setRadiosGuardados(radiosNuevos)

      const promosNuevas = { ...promosGuardadas }
      for (const franja of FRANJAS) {
        const p = promos[franja]
        const antes = promosGuardadas[franja]
        if (!p || (antes && p.descripcion === antes.descripcion && p.mensaje === antes.mensaje)) continue
        const r = await supabase.rpc('guardar_promo', { p_pin: pin, p_franja: franja, p_descripcion: p.descripcion, p_mensaje: p.mensaje })
        if (anotar(`Promo de ${franja}`, r)) promosNuevas[franja] = p
      }
      setPromosGuardadas(promosNuevas)
    }
    setGuardando(false)
  }

  const sede = sedes.find(s => String(s.id) === sedeId)
  const cantidades = [...new Set([...CANTIDADES, Number(form.sellos)])].sort((a, b) => a - b)

  return (
    <>
      <Encabezado comercio={comercio} />
      <main className="pagina">
        <div>
          <h1>Diseñá tu tarjeta de fidelidad</h1>
          <p className="subtitulo">Elegí cómo se ve la tarjeta, qué premio da y qué avisos reciben tus clientes.</p>
        </div>

        <div className="diseno">
          <form className="bloque formulario diseno-form" onSubmit={guardar}>
            <label>Nombre del comercio<input name="nombre" value={form.nombre} onChange={cambiar} required /></label>
            <label>Premio al completar<input name="premio" value={form.premio} onChange={cambiar} required /></label>

            <fieldset className="grupo">
              <legend>Cantidad de sellos</legend>
              <div className="opciones">
                {cantidades.map(n => (
                  <button key={n} type="button" className="opcion" aria-pressed={Number(form.sellos) === n} onClick={() => setForm({ ...form, sellos: n })}>{n}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="grupo">
              <legend>Color de la tarjeta</legend>
              <div className="opciones">
                {COLORES.map(c => (
                  <button key={c} type="button" className="color" style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={form.color.toUpperCase() === c} onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </fieldset>

            <fieldset className="grupo">
              <legend>Radio del aviso por sede</legend>
              <label>Sede
                <select value={sedeId} onChange={e => setSedeId(e.target.value)}>
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </label>
              {sede && (
                <>
                  <label>Radio
                    <span className="deslizador">
                      <input type="range" min="50" max="300" step="10" value={radios[sede.id]} onChange={e => setRadios({ ...radios, [sede.id]: Number(e.target.value) })} />
                      <output>{radios[sede.id]} m</output>
                    </span>
                  </label>
                  <MiniMapa sede={sede} radio={radios[sede.id]} color={form.color} />
                </>
              )}
            </fieldset>

            <fieldset className="grupo">
              <legend>Mensajes por franja</legend>
              {FRANJAS.map(franja => (
                <div key={franja} className="franja">
                  <span className="franja-nombre">{franja}</span>
                  <label>Descripción<input value={promos[franja]?.descripcion ?? ''} onChange={e => cambiarPromo(franja, 'descripcion', e.target.value)} /></label>
                  <label>Mensaje del aviso<input value={promos[franja]?.mensaje ?? ''} onChange={e => cambiarPromo(franja, 'mensaje', e.target.value)} /></label>
                </div>
              ))}
            </fieldset>

            <fieldset className="grupo">
              <legend>Guardar</legend>
              <label>PIN<input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} required /></label>
              <button className="boton" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
              {resultados.length > 0 && (
                <div className="resultados" role="status">
                  {resultados.map(r => (
                    <p key={r.titulo} className={`resultado ${r.bien ? 'bien' : 'mal'}`}>{r.titulo}: {r.texto}</p>
                  ))}
                </div>
              )}
            </fieldset>
          </form>

          <aside className="diseno-vista">
            <h2>Vista previa</h2>
            <TarjetaCliente
              comercio={form.nombre || 'Tu comercio'}
              color={form.color}
              cliente="Nombre del cliente"
              sellos={2}
              necesarios={Number(form.sellos)}
              premio={form.premio || 'tu premio'}
              qr="club-delta-ejemplo"
            />
            <Link className="boton boton-claro" to="/qr">QR para registrarse</Link>
          </aside>
        </div>
      </main>
    </>
  )
}
