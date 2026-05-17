import React from 'react';
import type { MovimientoMaterial } from '../../models/MovimientoMaterial';
import { LuX, LuArrowUpDown, LuPackage, LuUser } from 'react-icons/lu';
import { formatDate } from '../../helper/DateFormater';

interface DetailMovimientoModalProps {
  movimiento: MovimientoMaterial;
  isOpen: boolean;
  onClose: () => void;
}

const DetailMovimientoModal: React.FC<DetailMovimientoModalProps> = ({
  movimiento,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const isIngreso = movimiento.Tipo_Movimiento === 'Entrada';


  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Detalle del Movimiento
            </h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
          <div className="space-y-6">
            {/* Información del Movimiento */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuArrowUpDown className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información del Movimiento</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Tipo de Movimiento
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
                      isIngreso 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {movimiento.Tipo_Movimiento}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Cantidad del Movimiento
                    </label>
                    <p className={`text-sm font-semibold ${
                      isIngreso ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isIngreso ? '+' : '-'}{movimiento.Cantidad} {movimiento.Material?.Unidad_Medicion?.Nombre_Unidad_Medicion }
                    </p>
                  </div>

                  {movimiento.Motivo && (
                    <div className="bg-gray-50 p-4 rounded-lg col-span-1 lg:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Motivo
                      </label>
                      <p className="text-sm text-gray-900">{movimiento.Motivo}</p>
                    </div>
                  )}

                  {movimiento.Observaciones && (
                    <div className="bg-gray-50 p-4 rounded-lg col-span-1 lg:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Observaciones
                      </label>
                      <p className="text-sm text-gray-900 break-words">{movimiento.Observaciones}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Material */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuPackage className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información del Material</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Material
                    </label>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {movimiento.Material?.Nombre_Material || 'Material no disponible'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Cantidad Anterior
                    </label>
                    <p className="text-sm text-gray-900">
                      {movimiento.Cantidad_Anterior} {movimiento.Material?.Unidad_Medicion?.Nombre_Unidad_Medicion}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Cantidad Nueva
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {movimiento.Cantidad_Nueva} {movimiento.Material?.Unidad_Medicion?.Nombre_Unidad_Medicion}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuUser className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información Adicional</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {movimiento.Usuario && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        realizado por
                      </label>
                      <p className="text-sm text-gray-900">{movimiento.Usuario.Nombre_Usuario}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Fecha del Movimiento
                    </label>
                    <p className="text-sm text-gray-900">
                      {movimiento.Fecha_Movimiento ? formatDate(movimiento.Fecha_Movimiento) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

export default DetailMovimientoModal;