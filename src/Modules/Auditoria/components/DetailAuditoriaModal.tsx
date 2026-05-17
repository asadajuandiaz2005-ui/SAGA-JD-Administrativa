import { LuX, LuFileText, LuUser, LuCalendar, LuActivity, LuDatabase } from 'react-icons/lu';
import type { DetailAuditoriaModalProps } from '../types/AuditoriaTypes';

const DetailAuditoriaModal = ({
  auditoria,
  isOpen,
  onClose,
}: DetailAuditoriaModalProps) => {
  if (!isOpen || !auditoria) return null;

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleString('es-CR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'Creación':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Actualización':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Eliminación':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const parseJsonData = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  };

  const datosAnteriores = parseJsonData(auditoria.Datos_Anteriores);
  const datosNuevos = parseJsonData(auditoria.Datos_Nuevos);

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Detalle de Auditoría
            </h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>


        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 rounded-lg">
                <LuFileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Módulo
                </p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {auditoria.Modulo}
                </p>
              </div>
            </div>

            {/* Acción */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 rounded-lg">
                <LuActivity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Acción
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getAccionColor(
                    auditoria.Accion
                  )}`}
                >
                  {auditoria.Accion}
                </span>
              </div>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 rounded-lg">
                <LuUser className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Usuario Responsable
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">{auditoria.Usuario?.Nombre_Usuario || 'Desconocido'}</p>
            </div>

                <div className="">
                <p className='text-xs font-medium text-gray-500 uppercase text-center'>Rol</p>
                    <span className="font-medium text-gray-900 mt-1 inline-block px-2 py-0.5 text-xs">
                      {auditoria.Usuario.Nombre_Rol}
                  </span>
                  
              </div>
            </div>

            {/* Fecha */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2">
                <LuCalendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Fecha de Acción
                </p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {formatDate(auditoria.Fecha_Accion)}
                </p>
              </div>
            </div>

            {/* ID Registro */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
              <div className="p-2">
                <LuDatabase className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase">
                 Registro Afectado
                </p>
                <p className="text-base font-medium text-gray-900 mt-1 break-all">
                  {auditoria.Registro_Afectado}
                </p>
              </div>
            </div>
          </div>

          {/* Datos Anteriores y Nuevos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Datos Anteriores */}
            {datosAnteriores && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Datos Anteriores
                </h3>
                <div className="bg-white rounded p-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-100">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                    {typeof datosAnteriores === 'object'
                      ? JSON.stringify(datosAnteriores, null, 2)
                      : datosAnteriores}
                  </pre>
                </div>
              </div>
            )}

            {/* Datos Nuevos */}
            {datosNuevos && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Datos Nuevos
                </h3>
                <div className="bg-white rounded p-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-100">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                    {typeof datosNuevos === 'object'
                      ? JSON.stringify(datosNuevos, null, 2)
                      : datosNuevos}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Mensaje si no hay datos */}
          {!datosAnteriores && !datosNuevos && (
            <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                No hay datos de cambios registrados para esta auditoría.
              </p>
            </div>
          )}
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

export default DetailAuditoriaModal;
