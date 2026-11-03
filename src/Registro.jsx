import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { guardarCodigo } from './utilidades'

export default function Registro() {
  const navigate = useNavigate()
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
    const { data, error } = await supabase.rpc('registrar_cliente', {
      p_nombre: form.nombre,
      p_apellido: form.apellido,
      p_email: form.email,
      p_telefono: form.telefono,
      p_acepta: form.acepta
    })
    setEnviando(false)
    if (error) { setError(error.message); return }
    guardarCodigo(data)
    navigate('/tarjeta')
  }

  return (
    <div className="movil">
      <div className="cabecera">
        <p>Sumate al club de</p>
        <h1>Restaurante Delta</h1>
        <span className="chip">8 sellos = cena para dos</span>
      </div>
      <form className="formulario" onSubmit={enviar}>
        <label>Nombre<input name="nombre" value={form.nombre} onChange={cambiar} required /></label>
        <label>Apellido<input name="apellido" value={form.apellido} onChange={cambiar} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={cambiar} required /></label>
        <label>Teléfono<input name="telefono" type="tel" value={form.telefono} onChange={cambiar} /></label>
        <label className="check">
          <input name="acepta" type="checkbox" checked={form.acepta} onChange={cambiar} />
          Avisarme cuando esté cerca de una sede (uso tu ubicación solo con la tarjeta abierta)
        </label>
        {error && <p className="error">{error}</p>}
        <button className="boton" disabled={enviando}>{enviando ? 'Creando…' : 'Crear mi tarjeta'}</button>
      </form>
    </div>
  )
}
