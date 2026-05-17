import { useAllowedModules } from '../../../Auth/provider/PermisoProvider'
import ModuleCard from './ModuleCard'

const Modulos = () => {
  const { allowedModules } = useAllowedModules()

  // Filtrar módulos ocultos (como Roles que solo se accede desde Usuarios)
  const visibleModules = allowedModules.filter(mod => !mod.hidden)

  return (
    <section className="bg-gray-100 rounded-lg shadow-md">
      <div className="p-4">
        <div className="mb-4 flex items-center">
          <h1 className="text-3xl md:text-5xl font-bold text-start py-4">
            Panel administrativo ASADA Juan Díaz
          </h1>
        </div>
        <div className="overflow-y-auto max-h-[70vh] pr-2 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleModules.map((mod, index) => (
              <ModuleCard 
                key={`${mod.name}-${index}`}
                name={mod.name} 
                icon={mod.icon} 
                path={mod.path} 
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Modulos