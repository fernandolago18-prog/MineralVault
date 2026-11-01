import MiningLoader from '@/components/ui/MiningLoader'

/**
 * Loading state nativo de Next.js App Router para todas las rutas protegidas.
 * Se muestra instantáneamente (0ms) al navegar entre catálogo, colección,
 * detalle de mineral, etc. mediante streaming y React Suspense.
 */
export default function AppLoading() {
  return <MiningLoader />
}
