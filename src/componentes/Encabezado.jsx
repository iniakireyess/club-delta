import { NavLink } from 'react-router-dom'
import { IconoTarjeta } from './Iconos'

const PESTANAS = [
  { a: '/', texto: 'Mapa' },
  { a: '/diseno', texto: 'Mi tarjeta' },
  { a: '/caja', texto: 'Caja' },
  { a: '/qr', texto: 'QR mesas' }
]

export default function Encabezado({ comercio }) {
  return (
    <header className="encabezado">
      <div className="marca">
        <span className="marca-icono"><IconoTarjeta /></span>
        Club de Fidelidad
      </div>
      <nav className="pestanas" aria-label="Secciones">
        {PESTANAS.map(p => (
          <NavLink key={p.a} to={p.a} end className="pestana">{p.texto}</NavLink>
        ))}
      </nav>
      <div className="comercio">
        <strong>{comercio.nombre}</strong>
        <span className="chip-ejemplo">Datos de ejemplo</span>
      </div>
    </header>
  )
}
