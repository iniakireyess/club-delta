function Icono({ children, tam = 20 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconoTarjeta = props => (
  <Icono {...props}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Icono>
)

export const IconoRegalo = props => (
  <Icono {...props}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </Icono>
)

export const IconoMas = props => (
  <Icono {...props}><path d="M12 5v14M5 12h14" /></Icono>
)

export const IconoMenos = props => (
  <Icono {...props}><path d="M5 12h14" /></Icono>
)

export const IconoUbicacion = props => (
  <Icono {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icono>
)
