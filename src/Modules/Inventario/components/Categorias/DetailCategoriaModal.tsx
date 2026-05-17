import React from 'react';
import { LuX, LuTag, LuUser } from 'react-icons/lu';
import type { CategoriaMaterial } from '../../models/Inventario';
import { formatDate } from '../../helper/DateFormater';

interface DetailCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: CategoriaMaterial;
}

const DetailCategoriaModal: React.FC<DetailCategoriaModalProps> = ({ isOpen, onClose, categoria }) => {
  
  if (!isOpen) return null;

  const estado = categoria.Estado_Categoria?.Nombre_Estado_Categoria || 'Activa';
  const isActiva = estado === 'Activa';
  const colorClass = isActiva 
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
    : 'bg-slate-200 text-slate-700 border border-slate-400';

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Detalle de Categoría
            </h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuTag className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información General</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Nombre de la Categoría
                    </label>
                    <p className="text-sm font-medium text-gray-900 break-words">{categoria.Nombre_Categoria}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Estado
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${colorClass}`}>
                      {estado}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg col-span-1 lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Descripción
                    </label>
                    <p className="text-sm text-gray-900 break-words">
                      {categoria.Descripcion_Categoria || 'Sin descripción'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Registro */}
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
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label htmlFor='Fecha_Creacion' className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Fecha de Creación
                    </label>
                    <p className="text-sm text-gray-900">
                      {categoria.Fecha_Creacion ? formatDate(categoria.Fecha_Creacion) : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label htmlFor='Fecha_Actualizacion' className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Última Actualización
                    </label>
                    <p className="text-sm text-gray-900">
                      {categoria.Fecha_Actualizacion ? formatDate(categoria.Fecha_Actualizacion) : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Creado por
                    </label>
                    <p className="text-sm text-gray-900">
                      {categoria.Usuario?.Nombre_Usuario || 'Desconocido'} 
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

export default DetailCategoriaModal;