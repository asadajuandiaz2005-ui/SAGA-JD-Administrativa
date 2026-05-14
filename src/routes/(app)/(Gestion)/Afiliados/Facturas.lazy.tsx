import { createLazyFileRoute } from '@tanstack/react-router'
import FacturaTable from '@/Modules/Facturas/components/FacturaTable'

export const Route = createLazyFileRoute('/(app)/(Gestion)/Afiliados/Facturas')({
  component: FacturaTable,
})
