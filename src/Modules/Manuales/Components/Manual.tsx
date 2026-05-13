import { useUserPermissions } from "@/Modules/Auth/Hooks/PermissionHook";
import { modules } from "@/Modules/Global/components/DashboardGlobal/ModulosData";
import { useGetManuales } from "../Hook/hookManuales";

type ManualWithMetadata = {
  Nombre_Manual?: string;
  PDF_Manual?: string;
} & Record<string, unknown>;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getCompactKey = (value: string) => normalizeText(value).replaceAll(/[^a-z0-9]/g, "");

const splitTokens = (value: string): string[] =>
  normalizeText(value)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

const ignoredTokens = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "modulo",
  "modulos",
  "gestion",
  "revision",
  "control",
  "edicion",
  "uso",
  "manual",
]);

const moduleTokenMap = (() => {
  const map = new Map<string, string>();

  const registerToken = (token: string, permissionKey: string) => {
    const compactToken = getCompactKey(token);

    if (!compactToken || ignoredTokens.has(compactToken)) {
      return;
    }

    map.set(compactToken, permissionKey);
  };

  modules.forEach((module) => {
    const permissionKey = getCompactKey(module.Permiso);
    registerToken(permissionKey, permissionKey);

    [module.Permiso, module.name, module.path].forEach((candidate) => {
      splitTokens(candidate).forEach((token) => {
        registerToken(token, permissionKey);
      });
    });
  });

  const aliases: Record<string, string> = {
    usuario: "usuarios",
    afiliados: "abonados",
    afiliado: "abonados",
    abonado: "abonados",
    lecturas: "abonados",
    lectura: "abonados",
    proveedor: "proveedores",
    proyecto: "proyectos",
    imagen: "imagenes",
    solicitud: "solicitudes",
    quejas: "contacto",
    queja: "contacto",
    sugerencias: "contacto",
    sugerencia: "contacto",
    reportes: "contacto",
    reporte: "contacto",
    calidad: "calidadagua",
    agua: "calidadagua",
    calidaddeagua: "calidadagua",
    preguntas: "faq",
    frecuentes: "faq",
  };

  Object.entries(aliases).forEach(([alias, permission]) => {
    registerToken(alias, permission);
  });

  return map;
})();

const extractModuleCandidates = (manual: ManualWithMetadata): string[] => {
  const candidates: string[] = [];

  const addCandidate = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      candidates.push(value);
    }
  };

  addCandidate(manual.Permiso);
  addCandidate(manual.permiso);
  addCandidate(manual.Modulo);
  addCandidate(manual.modulo);
  addCandidate(manual.Nombre_Modulo);
  addCandidate(manual.nombreModulo);
  addCandidate(manual.rutaModulo);
  addCandidate(manual.pathModulo);

  const nestedModule = manual.Modulo ?? manual.modulo;
  if (nestedModule && typeof nestedModule === "object" && !Array.isArray(nestedModule)) {
    const moduleRecord = nestedModule as Record<string, unknown>;
    addCandidate(moduleRecord.Permiso);
    addCandidate(moduleRecord.permiso);
    addCandidate(moduleRecord.Modulo);
    addCandidate(moduleRecord.modulo);
    addCandidate(moduleRecord.Nombre_Modulo);
    addCandidate(moduleRecord.nombreModulo);
    addCandidate(moduleRecord.name);
    addCandidate(moduleRecord.path);
    addCandidate(moduleRecord.ruta);
  }

  addCandidate(manual.Nombre_Manual);
  addCandidate(manual.PDF_Manual);

  return candidates;
};

const resolveModulePermission = (manual: ManualWithMetadata): string | null => {
  const candidates = extractModuleCandidates(manual);

  for (const candidate of candidates) {
    const tokenMatches = splitTokens(candidate)
      .map((token) => moduleTokenMap.get(getCompactKey(token)))
      .filter(Boolean);

    if (tokenMatches.length > 0) {
      return tokenMatches[0] ?? null;
    }

    const compact = getCompactKey(candidate);
    const directMatch = compact ? moduleTokenMap.get(compact) : null;

    if (directMatch) {
      return directMatch;
    }
  }

  return null;
};

const toManualWithMetadata = (value: unknown): ManualWithMetadata => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as ManualWithMetadata;
};

const Manuales = () => {
  const { canView, isLoading: isLoadingPermissions } = useUserPermissions();
  const { data: archivos = [], isLoading: isLoadingManuales } = useGetManuales();

  const archivosFiltrados = archivos.filter((archivo) => {
    const modulePermission = resolveModulePermission(toManualWithMetadata(archivo));

    if (!modulePermission) {
      return true;
    }

    return canView(modulePermission);
  });

  const renderContent = () => {
    if (isLoadingManuales || isLoadingPermissions) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (archivos.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay documentos disponibles en este momento.</p>
        </div>
      );
    }

    if (archivosFiltrados.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay manuales disponibles para los modulos que tienes asignados.</p>
        </div>
      );
    }



    return (
      <div className="flex flex-col items-center w-full">
        {/* 🔹 Título centrado arriba */}
        <div className="flex items-center gap-2 sm:gap-4 flex-col justify-center text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ocupas ayuda?</h2>
            <p className="text-xs sm:text-sm text-gray-600 pb-2 sm:pb-4">Aquí puedes encontrar los manuales de usuario disponibles.</p>
        </div>
        
        {/* 🔹 Contenedor con scroll para las tarjetas */}
        <div className="w-full max-h-[calc(100vh-180px)] overflow-y-auto px-2 sm:px-6 pt-2 pb-10 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
            <div className='grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full'>
                {archivosFiltrados.map((archivo, idx: number) => (
          <div
            key={archivo.Id_Manual ?? idx}
            className='bg-white rounded-3xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col items-center text-center'
          >
            {/*icono */}
            <div className='bg-blue-100 p-4 sm:p-5 rounded-full mb-4 flex items-center justify-center'>
              <img
                src='\file_16425457.png'
                alt=' PDF Icon'
                className='w-10 sm:w-12 md:w-14 lg:w-16 h-auto max-w-full hover:scale-110 transition-transform duration-200'
              />
            </div>
            {/*titulos */}
            <h3 className='font-semibold text-base sm:text-lg md:text-xl text-gray-700 mb-4 line-clamp-2 w-full min-w-0 overflow-hidden'>
              <span className="block break-words [overflow-wrap:anywhere]">{archivo.Nombre_Manual}</span>
            </h3>
            {/*boton */}
            <a
              href={archivo.PDF_Manual}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-auto inline-block bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-2xl hover:bg-blue-700 shadow-sm hover:shadow-md transition text-sm sm:text-base'
            >
              Ver PDF
            </a>
          </div>
        ))}
            </div>
        </div>
      </div>
    );
  };

  return (
    <section className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 w-full">
      {renderContent()}
    </section>
  );
}

export default Manuales;