import { LuX, LuUser, LuFileText, LuMap } from 'react-icons/lu';
import type { DetailMedidorModalProps } from '../../types/MedidorTypes';
import { FaTachometerAlt, FaUsers } from 'react-icons/fa';
import { formatCedulaJuridica } from '@/Modules/Afiliados/Helper/formatUtils';

const DetailMedidorModal = ({ isOpen, onClose, medidor }: DetailMedidorModalProps) => {
  if (!isOpen) return null;

  const getEstadoBadgeColor = (estadoId: number) => {
    switch (estadoId) {
      case 1:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 2:
        return 'bg-green-100 text-green-800 border-green-200';
      case 3:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoPagoNombre = () => {
    if (!medidor.Afiliado) return 'Libre';

    const estadoPagoRaw = medidor.Estado_Pago;
    const nombre = typeof estadoPagoRaw === 'string'
      ? estadoPagoRaw
      : estadoPagoRaw?.Nombre_Estado_Pago;

    if (nombre === 'Pagado' || nombre === 'Pendiente' || nombre === 'Libre') {
      return nombre;
    }

    return 'Pendiente';
  };

  const getEstadoPagoBadgeColor = (estadoPago: string) => {
    if (estadoPago === 'Libre') return 'bg-slate-100 text-slate-800 border-slate-200';
    if (estadoPago === 'Pagado') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  // Función para obtener el nombre completo del afiliado
  const getNombreAfiliado = () => {
    if (!medidor.Afiliado) return null;
    
    const { Tipo_Entidad, Nombre, Primer_Apellido, Segundo_Apellido, Razon_Social, Nombre_Completo } = medidor.Afiliado;
    
    // Tipo 1: Persona Física
    if (Tipo_Entidad === 1) {
      if (Nombre && Primer_Apellido) {
        return `${Nombre} ${Primer_Apellido} ${Segundo_Apellido || ''}`.trim();
      }
      return Nombre_Completo || 'No especificado';
    }
    
    // Tipo 2: Persona Jurídica
    if (Tipo_Entidad === 2) {
      return Razon_Social || 'No especificado';
    }
    
    // Fallback para casos legacy
    return Nombre_Completo || Razon_Social || 'No especificado';
  };

  // Función para obtener el número de identificación
  const getIdentificacion = () => {
    if (!medidor.Afiliado) return null;
    
    const { Tipo_Entidad, Identificacion, Cedula_Juridica } = medidor.Afiliado;
    
    if (Tipo_Entidad === 1) {
      return Identificacion || 'No especificado';
    }
    
    if (Tipo_Entidad === 2) {
      return formatCedulaJuridica(Cedula_Juridica) || 'No especificado';
    }
    
    return Identificacion || Cedula_Juridica || 'No especificado';
  };

  // Función para obtener el tipo de afiliado
  const getTipoAfiliado = () => {
    if (!medidor.Afiliado) return null;
    
    const { Tipo_Entidad, Tipo_Afiliado } = medidor.Afiliado;
    
    if (Tipo_Entidad === 1) {
      return 'Persona Física';
    }
    
    if (Tipo_Entidad === 2) {
      return 'Persona Jurídica';
    }
    
    return Tipo_Afiliado || 'No especificado';
  };

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Detalles del Medidor
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          {/* Información del Medidor */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {/* Ícono estandarizado con fondo azul claro */}
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaTachometerAlt className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Información del Medidor</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Número del Medidor
                  </label>
                  <p className="text-md font-bold text-gray-900 font-mono">
                    {medidor.Numero_Medidor}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Estado
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getEstadoBadgeColor(medidor.Estado_Medidor.Id_Estado_Medidor)}`}>
                    {medidor.Estado_Medidor.Nombre_Estado_Medidor}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Estado de Pago
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getEstadoPagoBadgeColor(getEstadoPagoNombre())}`}>
                    {getEstadoPagoNombre()}
                  </span>
                </div>
              </div>
            </div>
          </div>

             {/* Documentos del Terreno */}
          {(medidor.Certificacion_Literal || medidor.Planos_Terreno) && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuFileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Documentos del Terreno</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {medidor.Certificacion_Literal && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Certificación Literal
                      </label>
                      <a
                        href={medidor.Certificacion_Literal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                      >
                        <LuFileText className="w-4 h-4" />
                        Ver Certificación
                      </a>
                    </div>
                  )}
                  {medidor.Planos_Terreno && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Planos del Terreno
                      </label>
                      <a
                        href={medidor.Planos_Terreno}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                      >
                        <LuMap className="w-4 h-4" />
                        Ver Planos
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información del Afiliado */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Información del Afiliado</h3>
              </div>
            </div>
            <div className="p-5">
              {medidor.Afiliado ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      {medidor.Afiliado.Tipo_Entidad === 2 ? 'Razón Social' : 'Nombre Completo'}
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {getNombreAfiliado()}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      {medidor.Afiliado.Tipo_Entidad === 2 ? 'Cédula Jurídica' : 'Identificación'}
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {getIdentificacion()}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Correo Electrónico
                    </label>
                    <p className="text-sm text-gray-900">
                      {medidor.Afiliado.Correo || 'No especificado'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Número de Teléfono
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {medidor.Afiliado.Numero || 'No especificado'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Tipo de Afiliado
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      {getTipoAfiliado()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 font-medium">Sin afiliado asignado</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Este medidor aún no ha sido asignado a ningún afiliado
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usuario Creador */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <LuUser className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Información de Registro</h3>
              </div>
            </div>
             <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Fecha de Creación
                  </label>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDate(medidor.Fecha_Creacion)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Última Actualización
                  </label>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDate(medidor.Fecha_Actualizacion)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Usuario Creador
                  </label>
                  <p className="text-sm text-gray-900 font-medium">
                    {medidor.Usuario.Nombre_Usuario}
                  </p>
                </div>

               
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailMedidorModal;