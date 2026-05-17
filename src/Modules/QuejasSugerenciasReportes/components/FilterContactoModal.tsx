// src/Modules/QuejasSugerenciasReportes/components/FilterContactoModal.tsx
import React, { useState } from 'react';
import { LuFilter } from 'react-icons/lu';
import type { FilterContactoModalProps, ContactoFilterOptions, TipoContacto } from '../types/ContactoTypes';

const FilterContactoModal: React.FC<FilterContactoModalProps> = ({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}) => {
  const [filters, setFilters] = useState<ContactoFilterOptions>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearFilters: ContactoFilterOptions = {
      tipo: undefined,
      estado: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      conAdjunto: false,
    };
    setFilters(clearFilters);
    onApplyFilters(clearFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <section className="fixed inset-0 flex items-start justify-end z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LuFilter className="w-5 h-5" />
            Filtros Avanzados
          </h2>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          
          {/* Filtro por Estado (solo para reportes) */}

        <div className="flex items-center gap-4">
            <label htmlFor="tipo-contacto-filter-select" className="text-sm font-medium text-gray-700">Tipo:</label>
            <select
              id="tipo-contacto-filter-select"
              value={filters.tipo || "todos"}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                tipo: e.target.value === "todos" ? undefined : e.target.value as TipoContacto
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              <option value="Queja">Quejas</option>
              <option value="Sugerencia">Sugerencias</option>
              <option value="Reporte">Reportes</option>
            </select>
          </div>

          {/* Filtro por Rango de Fechas */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Fechas
            </div>
            <div className="space-y-2">
              <div>
                <label htmlFor="fecha-inicio" className="block text-xs text-gray-600 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  id="fecha-inicio"
                  value={filters.fechaInicio || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    fechaInicio: e.target.value || undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="fecha-fin" className="block text-xs text-gray-600 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  id="fecha-fin"
                  value={filters.fechaFin || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    fechaFin: e.target.value || undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filtro por Adjuntos */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Adjuntos
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.conAdjunto || false}
                onChange={(e) => setFilters(prev => ({ ...prev, conAdjunto: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Solo con archivos adjuntos</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FilterContactoModal;
