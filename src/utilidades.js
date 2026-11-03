// Distancia en metros entre dos puntos (fórmula de Haversine)
export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const rad = g => (g * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Devuelve la promo de la franja horaria actual (o la de "Fuera de horario")
export function promoActual(promos) {
  const hhmm = new Date().toTimeString().slice(0, 5)
  const enHorario = promos.find(p => p.hora_inicio && hhmm >= p.hora_inicio.slice(0, 5) && hhmm <= p.hora_fin.slice(0, 5))
  return enHorario || promos.find(p => !p.hora_inicio) || null
}

// El código del cliente se guarda en este celular para no pedirlo cada vez
export function leerCodigo() {
  try { return localStorage.getItem('club-delta-codigo') } catch { return null }
}
export function guardarCodigo(codigo) {
  try { localStorage.setItem('club-delta-codigo', codigo) } catch { /* sin almacenamiento */ }
}