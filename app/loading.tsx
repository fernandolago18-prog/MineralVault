import MiningLoader from '@/components/ui/MiningLoader'

/**
 * Loading state nativo de Next.js a nivel de raíz para transiciones globales.
 */
export default function RootLoading() {
  return <MiningLoader fullScreen />
}
