import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useComercio } from '../useComercio'
import { guardarCodigo, iniciales } from '../utilidades'

export default function Registro() {
  const navigate = useNavigate()
  const { comercio } = useComercio()
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', acepta: true })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const cambiar = e => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const telefono = form.telefono.trim()
    const { data, error } = await supabase.rpc('registrar_cliente', {
      p_nombre: form.nombre,
      p_apellido: form.apellido,
      p_email: form.email,
      p_telefono: telefono ? `+54 ${telefono}` : '',
      p_acepta: form.acepta
    })
    setEnviando(false)
    if (error) { setError(error.message); return }
    guardarCodigo(data)
    navigate('/tarjeta')
  }

  return (
    <div className="movil movil-registro">
      <div className="cabecera-registro">
        <span className="iniciales">{iniciales(comercio.nombre)}</span>
        <p>Sumate al club de</p>
        <h1>{comercio.nombre}</h1>
        <span className="chip-blanco">{comercio.sellos_necesarios} sellos = {comercio.premio}</span>
      </div>
      <form className="formulario" onSubmit={enviar}>
        <div className="dos-campos">
          <label>Nombre<input name="nombre" autoComplete="given-name" value={form.nombre} onChange={cambiar} required /></label>
          <label>Apellido<input name="apellido" autoComplete="family-name" value={form.apellido} onChange={cambiar} required /></label>
        </div>
        <label>Email<input name="email" type="email" autoComplete="email" value={form.email} onChange={cambiar} required /></label>
        <label>Teléfono
          <span className="prefijo">
            <span>+54</span>
            <input name="telefono" type="tel" autoComplete="tel-national" value={form.telefono} onChange={cambiar} />
          </span>
        </label>
        <label className="casilla">
          <input name="acepta" type="checkbox" checked={form.acepta} onChange={cambiar} />
          <span>
            Avisarme cuando esté cerca
            <small>Uso tu ubicación solo con la tarjeta abierta, para avisarte de las promos de la sede más cercana.</small>
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="boton" disabled={enviando}>{enviando ? 'Creando…' : 'Crear mi tarjeta'}</button>
      </form>
      <p className="gris nota-registro">Llegaste acá escaneando el QR del local</p>
    </div>
  )
}
