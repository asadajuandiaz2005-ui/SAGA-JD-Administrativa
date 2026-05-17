import { 
  LuX, 
  LuCalendar, 
  LuMapPin, 
  LuMessageSquare,
} from 'react-icons/lu';
import { MdReportProblem } from 'react-icons/md';
import { FaLightbulb, FaUserFriends } from 'react-icons/fa';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ContactoItem } from '../types/ContactoTypes';
import { FileText } from 'lucide-react';

interface ContactoDetailModalProps {
  item: ContactoItem;
  isOpen: boolean;
  onClose: () => void;
}

const extractAdjuntoUrl = (adjunto: unknown): string | null => {
  if (typeof adjunto === 'string') {
    return adjunto.trim() || null;
  }

  if (Array.isArray(adjunto)) {
    for (const value of adjunto) {
      const nestedUrl = extractAdjuntoUrl(value);
      if (nestedUrl) return nestedUrl;
    }
    return null;
  }

  if (adjunto && typeof adjunto === 'object') {
    const record = adjunto as Record<string, unknown>;
    const urlCandidate = record.url ?? record.href ?? record.path ?? record.src ?? record.Adjunto;
    return typeof urlCandidate === 'string' && urlCandidate.trim() ? urlCandidate : null;
  }

  return null;
};

const getAdjuntoNombre = (url: string): string => {
  const rawName = url.split('/').pop()?.split('?')[0] || 'Archivo adjunto';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
};

const ContactoDetailModal = ({ item, isOpen, onClose }: ContactoDetailModalProps) => {
  if (!isOpen) return null;

  const getTipoConfig = (tipo: string) => {
    const configs = {
      'Queja': { icon: MdReportProblem, color: 'bg-red-100 text-red-600', title: 'Detalle de Queja' },
      'Sugerencia': { icon: FaLightbulb, color: 'bg-yellow-100 text-yellow-600', title: 'Detalle de Sugerencia' },
      'Reporte': { icon: HiOutlineDocumentReport, color: 'bg-blue-100 text-blue-600', title: 'Detalle de Reporte' }
    };
    return configs[tipo as keyof typeof configs];
  };

  const config = getTipoConfig(item.tipo);
  const IconComponent = config.icon;
  const adjuntoUrl = extractAdjuntoUrl(item.adjunto) ?? '';
  const adjuntoNombre = adjuntoUrl ? getAdjuntoNombre(adjuntoUrl) : 'Archivo adjunto';

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              {config.title}
            </h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
          <div className="space-y-6">
            {/* Información Personal (si existe) */}
            {(item.nombre || item.primerApellido || item.segundoApellido) && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaUserFriends className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Información Personal</h3>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {item.nombre && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Nombre
                        </label>
                        <p className="text-sm font-medium text-gray-900 break-all">{item.nombre}</p>
                      </div>
                    )}
                    {item.primerApellido && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Primer Apellido
                        </label>
                        <p className="text-sm font-medium text-gray-900 break-all">{item.primerApellido}</p>
                      </div>
                    )}
                    {item.segundoApellido && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Segundo Apellido
                        </label>
                        <p className="text-sm font-medium text-gray-900 break-all">{item.segundoApellido}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contenido del Mensaje */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuMessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Contenido</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Mensaje - Columna Izquierda */}
                  <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Descripción
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed break-all">{item.mensaje}</p>
                  </div>

                  {/* Archivo Adjunto - Columna Derecha */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Archivo Adjunto
                    </label>
                    {adjuntoUrl ? (
                     <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                    <FileText size={24} className="text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                  {adjuntoNombre}
                                </p>
                            </div>
                        </div>
                        <a
                            href={adjuntoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 group/btn flex-shrink-0"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="group-hover/btn:scale-110 transition-transform"
                            >
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            Ver
                        </a>
                    </div>
                    {/* Efecto de brillo al hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer pointer-events-none"></div>
                  </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin adjuntos</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Tipo y Usuario */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información General</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Tipo */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Tipo
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${config.color} border border-gray-200`}>
                      {item.tipo}
                    </span>
                  </div>

                  {/* Fecha de Creación */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Fecha de Creación
                    </label>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <LuCalendar className="w-4 h-4 text-gray-400" />
                      {item.fechaCreacion ? 
                        format(new Date(item.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                        'No disponible'
                      }
                    </p>
                  </div>

                  {/* Ubicación */}
                  {item.ubicacion && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Ubicación
                      </label>
                      <p className="text-sm text-gray-900 flex items-start gap-2 min-w-0">
                        <LuMapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="break-words whitespace-pre-wrap min-w-0">{item.ubicacion}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactoDetailModal;