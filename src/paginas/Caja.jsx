import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../supabase'
import { useComercio } from '../useComercio'
import Encabezado from '../componentes/Encabezado'

// sumar_sello informa los fallos como texto: solo estos mensajes significan que se sumó
const SUMO = /sumado|completa/i

export default function Caja() {
  const { comercio } = useComercio()
  const [sedes, setSedes] = useState([])
  const [sede, setSede] = useState('')
  const [pin, setPin] = useState('')
  const [mensaje, setMensaje] = useState({ texto: 'Elegí la sede, poné el PIN y escaneá el QR del cliente', tipo: '' })
  const [manual, setManual] = useState('')
  const datos = useRef({ sede: '', pin: '' })
  const ultimo = useRef({ codigo: '', hora: 0 })

  useEffect(() => { datos.current = { sede, pin } }, [sede, pin])

  useEffect(() => {
    supabase.from('sedes').select('id, nombre').then(({ data }) => data && setSedes(data))
  }, [])

  async function sumar(codigo) {
    // Primero se valida: un intento sin sede o sin PIN no cuenta como lectura del QR
    const { sede, pin } = datos.current
    if (!sede || !pin) { setMensaje({ texto: 'Falta elegir la sede o poner el PIN', tipo: 'mal' }); return }
    const ahora = Date.now()
    if (codigo === ultimo.current.codigo && ahora - ultimo.current.hora < 5000) return // evita sumar dos veces el mismo QR
    ultimo.current = { codigo, hora: ahora }
    const { data, error } = await supabase.rpc('sumar_sello', { p_codigo: codigo.trim(), p_sede: Number(sede), p_pin: pin })
    if (error) setMensaje({ texto: `Error: ${error.message}`, tipo: 'mal' })
    else setMensaje({ texto: data, tipo: SUMO.test(data) ? 'bien' : 'mal' })
  }

  useEffect(() => {
    const lector = new Html5QrcodeScanner('lector', { fps: 10, qrbox: 220 }, false)
    lector.render(texto => sumar(texto), () => {})
    return () => { lector.clear().catch(() => {}) }
  }, [])

  return (
    <>
      <Encabezado comercio={comercio} />
      <main className="pagina pagina-angosta">
        <h1>Caja · sumar sello</h1>
        <div className="bloque formulario">
          <label>Sede
            <select value={sede} onChange={e => setSede(e.target.value)}>
              <option value="">Elegí la sede</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </label>
          <label>PIN de caja<input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} /></label>
        </div>
        <p className={`resultado ${mensaje.tipo}`} role="status">{mensaje.texto}</p>
        <div className="bloque"><div id="lector" /></div>
        <form className="bloque formulario" onSubmit={e => { e.preventDefault(); sumar(manual) }}>
          <label>Sin cámara: pegá el código del cliente<input value={manual} onChange={e => setManual(e.target.value)} required /></label>
          <button className="boton">Sumar sello</button>
        </form>
      </main>
    </>
  )
}
