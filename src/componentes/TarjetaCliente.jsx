import { QRCodeSVG } from 'qrcode.react'
import { iniciales } from '../utilidades'

function textoProgreso(sellos, necesarios, premio) {
  const premioEnFrase = premio.charAt(0).toLowerCase() + premio.slice(1)
  const faltan = necesarios - sellos
  if (faltan <= 0) return `¡Completaste la tarjeta! Premio: ${premioEnFrase}`
  return faltan === 1 ? `Te falta 1 sello para ${premioEnFrase}` : `Te faltan ${faltan} sellos para ${premioEnFrase}`
}

// Tarjeta del cliente: se usa en /tarjeta y en la vista previa de /diseno
export default function TarjetaCliente({ comercio, color, cliente, sellos, necesarios, premio, canjes = 0, qr, codigo }) {
  return (
    <div className="tarjeta" style={color ? { background: color } : undefined}>
      <div className="tarjeta-fila">
        <div className="tarjeta-comercio">
          <span className="iniciales">{iniciales(comercio)}</span>
          <strong>{comercio}</strong>
        </div>
        <div className="tarjeta-contador">
          <small>Sellos</small>
          <strong>{sellos} / {necesarios}</strong>
        </div>
      </div>
      <div>
        <small>Cliente</small>
        <p className="tarjeta-nombre">{cliente}</p>
      </div>
      <div className="sellos">
        {Array.from({ length: necesarios }, (_, i) => (
          <span key={i} className={i < sellos ? 'sello lleno' : 'sello'} />
        ))}
      </div>
      <p className="tarjeta-progreso">{textoProgreso(sellos, necesarios, premio)}</p>
      {canjes > 0 && <p className="tarjeta-progreso">Premios ganados: {canjes}</p>}
      <div className="qr">
        <QRCodeSVG value={qr} size={160} />
        <small>Mostralo en caja para sumar un sello</small>
        {codigo && <code className="codigo">{codigo}</code>}
      </div>
    </div>
  )
}
