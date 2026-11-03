import { QRCodeSVG } from 'qrcode.react'
import { useComercio } from '../useComercio'
import Encabezado from '../componentes/Encabezado'

export default function QrMesa() {
  const { comercio } = useComercio()
  const link = `${window.location.origin}/registro`
  return (
    <>
      <Encabezado comercio={comercio} />
      <main className="pagina pagina-angosta">
        <div className="bloque tarjeta-qr">
          <h1>{comercio.nombre}</h1>
          <p>Escaneá y sumate al club</p>
          <QRCodeSVG value={link} size={260} />
          <p className="gris">{comercio.sellos_necesarios} sellos = {comercio.premio}</p>
          <small className="gris">{link}</small>
        </div>
      </main>
    </>
  )
}
