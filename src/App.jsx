import { Routes, Route } from 'react-router-dom'
import Panel from './Panel'
import Registro from './Registro'
import Tarjeta from './Tarjeta'
import Caja from './Caja'
import QrMesa from './QrMesa'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Panel />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/tarjeta" element={<Tarjeta />} />
      <Route path="/caja" element={<Caja />} />
      <Route path="/qr" element={<QrMesa />} />
    </Routes>
  )
}