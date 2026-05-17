import React, { useState } from 'react';
import { LuSearch, LuPlus } from 'react-icons/lu';
import type { MaterialSelectorProps } from '../../../types/MovimientoTypes';
import { MaterialInfo } from '@/Modules/Inventario/helper/Movimientos';
import CreateMaterialModal from '../../Materiales/CreateMaterialModal';




const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  selectedMaterial,
  showMaterialSelector,
  setShowMaterialSelector,
  materialesFiltrados,
  loadingMateriales,
  busquedaMaterial,
  setBusquedaMaterial,
  handleSelectMaterial
}) => {

    const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <div className="block text-sm font-medium flex justify-between text-gray-700 mb-3">
        <span>Selección de Material</span>
        <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
      >
        <LuPlus className="w-3 h-3" />
        Nuevo Material
      </button>
      </div>
      {selectedMaterial && !showMaterialSelector ? (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MaterialInfo material={selectedMaterial} />
        </div>
        <button
          onClick={() => setShowMaterialSelector(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap ml-2"
        >
          Cambiar
        </button>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar material por nombre o categoría..."
            value={busquedaMaterial}
            onChange={(e) => setBusquedaMaterial(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {loadingMateriales ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando materiales...</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
            {materialesFiltrados.length > 0 ? (
              materialesFiltrados.map((material) => (
                <button
                  key={material.Id_Material}
                  onClick={() => handleSelectMaterial(material)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <MaterialInfo
                        material={material}
                        showCategories={true}
                        categoriesProps={{
                          emptyClass: "px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded",
                          itemClass: "px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {busquedaMaterial ? 'No se encontraron materiales' : 'No hay materiales disponibles'}
              </div>
            )}
          </div>
        )}
      </div>
    )}
    <CreateMaterialModal
      isOpen={showCreateModal}
      onClose={() => setShowCreateModal(false)}
    />
  </div>
);
}

export default MaterialSelector;