import { QRCodeSVG } from 'qrcode.react'

export default function QrMesa() {
  const link = `${window.location.origin}/registro`
  return (
    <div className="movil centrado">
      <h1>Restaurante Delta</h1>
      <p>Escaneá y sumate al club: 8 sellos = cena para dos</p>
      <QRCodeSVG value={link} size={240} />
      <small>{link}</small>
    </div>
  )
}
