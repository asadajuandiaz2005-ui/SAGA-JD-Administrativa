import React, { useState } from 'react';
import { LuX, LuFilter } from 'react-icons/lu';
import type { FilterMaterialModalProps, MaterialFilterOptions } from '../../types/MaterialTypes';



const FilterMaterialModal: React.FC<FilterMaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}) => {
  
  const [filters, setFilters] = useState<MaterialFilterOptions>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearFilters: MaterialFilterOptions = {
      conStock: false,
      precioMin: undefined,
      precioMax: undefined,
      soloConCategorias: false,
      soloSinCategorias: false,
      stockMinimo: undefined,
      stockMaximo: undefined,
      tipoFiltroStock: undefined,
    };
    setFilters(clearFilters);
    onApplyFilters(clearFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <section className="fixed inset-0 flex items-start justify-end z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LuFilter className="w-5 h-5" />
            Filtros Avanzados
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Categorías
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.soloConCategorias || false}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    soloConCategorias: e.target.checked,
                    soloSinCategorias: e.target.checked ? false : prev.soloSinCategorias
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solo materiales con categorías</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.soloSinCategorias || false}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    soloSinCategorias: e.target.checked,
                    soloConCategorias: e.target.checked ? false : prev.soloConCategorias
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solo materiales sin categorías</span>
              </label>
            </div>
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Stock
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.conStock || false}
                  onChange={(e) => setFilters(prev => ({ ...prev, conStock: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solo materiales con stock disponible</span>
              </label>
              
              <div>
                <label htmlFor="tipo-filtro-stock" className="block text-xs font-medium text-gray-600 mb-1">
                  Tipo de filtro por cantidad
                </label>
                <select
                  id="tipo-filtro-stock"
                  value={filters.tipoFiltroStock || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    tipoFiltroStock: e.target.value as 'encima' | 'debajo' | 'entre' | undefined
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin filtro por cantidad</option>
                  <option value="encima">Por encima de cantidad</option>
                  <option value="debajo">Por debajo de cantidad</option>
                  <option value="entre">Entre cantidades</option>
                </select>
              </div>

              {filters.tipoFiltroStock === 'encima' && (
                <div>
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={filters.stockMinimo || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      stockMinimo: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              )}

              {filters.tipoFiltroStock === 'debajo' && (
                <div>
                  <input
                    type="number"
                    placeholder="Cantidad máxima"
                    value={filters.stockMaximo || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      stockMaximo: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              )}

              {filters.tipoFiltroStock === 'entre' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Stock mín."
                    value={filters.stockMinimo || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      stockMinimo: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Stock máx."
                    value={filters.stockMaximo || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      stockMaximo: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Precio
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Precio mín."
                  value={filters.precioMin || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    precioMin: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Precio máx."
                  value={filters.precioMax || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    precioMax: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              onClick={handleApply}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClear}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Limpiar Todo
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FilterMaterialModal