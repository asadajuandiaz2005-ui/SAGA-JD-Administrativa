import React from 'react';
import { LuX, LuPackage, LuShoppingCart, LuUser } from 'react-icons/lu';
import type { Material } from '../../models/Inventario';
import { 
  getEstadoMaterialColorClass, 
  getProveedorNombre, 
  getProveedorTipo, 
  getProveedorTipoColorClass 
} from '../../helper/MaterialesHelpers';

interface DetailMaterialModalProps {
  material: Material;
  isOpen: boolean;
  onClose: () => void;
}

const DetailMaterialModal: React.FC<DetailMaterialModalProps> = ({
  material,
  isOpen,
  onClose,
}) => {
  const estado = material.Estado_Material?.Nombre_Estado_Material || 'N/A';
  const colorClass = getEstadoMaterialColorClass(estado);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Detalle del Material
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
                    <LuPackage className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información General</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Nombre del Material
                    </label>
                    <p className="text-sm font-medium text-gray-900 break-words">{material.Nombre_Material}</p>
                  </div>

                  <div className="bg-gray-50 p-4 flex-wrap rounded-lg ">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Descripción
                    </label>
                    <p className="text-sm text-gray-900 break-words ">{material.Descripcion || 'Sin descripción'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Estado
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${colorClass}`}>
                      {estado}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Categorías
                    </label>
                    <div className="text-sm text-gray-900">
                      {(() => {
                        // El backend devuelve "Categorias" como array directo de CategoriaMaterial
                        const categorias = material.Categorias || [];
                        
                        return categorias.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {categorias.map((cat: any, index: number) => {
                              // Si es del formato antiguo (con Categoria nested)
                              const categoria = cat.Categoria || cat;
                              const key = cat.Id_Material_Categoria || cat.Id_Categoria || index;
                              
                              return (
                                <span 
                                  key={key}
                                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {categoria.Nombre_Categoria}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Sin categorías</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventario y Precios */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Inventario y Precios</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Cantidad en Stock
                    </label>
                    <p className="text-sm font-medium text-gray-900">{material.Cantidad} unidades</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Precio Unitario
                    </label>
                    <p className="text-sm font-medium text-gray-900">₡{material.Precio_Unitario?.toLocaleString() || '0'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Número de Estantería
                    </label>
                    <p className="text-sm font-medium text-gray-900">{material.Numero_Estanteria ?? 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Proveedor
                    </label>
                    <p className="text-sm text-gray-900 break-words">{getProveedorNombre(material)}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Tipo de Proveedor
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getProveedorTipoColorClass(material?.Proveedor?.Tipo_Entidad)}`}>
                      {getProveedorTipo(material?.Proveedor?.Tipo_Entidad)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de registro */}
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
                    <p className="text-sm font-medium text-gray-900">{material.Fecha_Entrada ? new Date(material.Fecha_Entrada).toLocaleString() : 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Fecha de Actualización
                    </label>
                    <p className="text-sm font-medium text-gray-900">{material.Fecha_Actualizacion ? new Date(material.Fecha_Actualizacion).toLocaleString() : 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Última Fecha de Baja
                    </label>
                    <p className="text-sm font-medium text-gray-900">{material.Ultima_Fecha_Baja ? new Date(material.Ultima_Fecha_Baja).toLocaleString() : 'Sin baja'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Usuario Creador
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {material.Usuario?.Nombre_Usuario || 'N/A'} ({material.Usuario?.Nombre_Rol || 'N/A'})
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

export default DetailMaterialModal;