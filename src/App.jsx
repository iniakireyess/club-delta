import { Routes, Route } from 'react-router-dom'
import Panel from './paginas/Panel'
import Diseno from './paginas/Diseno'
import Registro from './paginas/Registro'
import Tarjeta from './paginas/Tarjeta'
import Caja from './paginas/Caja'
import QrMesa from './paginas/QrMesa'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Panel />} />
      <Route path="/diseno" element={<Diseno />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/tarjeta" element={<Tarjeta />} />
      <Route path="/caja" element={<Caja />} />
      <Route path="/qr" element={<QrMesa />} />
    </Routes>
  )
}
