import React, { useState, useEffect } from 'react';
import { LuCalendar, LuPackage, LuUser, LuFilter } from 'react-icons/lu';
import type { MovimientoFilterOptions } from '../../types/MovimientosTypes';

interface FilterMovimientosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: MovimientoFilterOptions) => void;
  currentFilters: MovimientoFilterOptions;
}

// Helper function to convert yyyy-mm-dd to dd/mm/yyyy
const convertDateFormat = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

const FilterMovimientosModal: React.FC<FilterMovimientosModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const [filters, setFilters] = useState<MovimientoFilterOptions>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert date formats from yyyy-mm-dd to dd/mm/yyyy before sending to backend
    const formattedFilters = {
      ...filters,
      fechaInicio: filters.fechaInicio ? convertDateFormat(filters.fechaInicio) : undefined,
      fechaFin: filters.fechaFin ? convertDateFormat(filters.fechaFin) : undefined,
    };
    onApplyFilters(formattedFilters);
    onClose();
  };

  const handleApply = () => {
    // Convert date formats from yyyy-mm-dd to dd/mm/yyyy before sending to backend
    const formattedFilters = {
      ...filters,
      fechaInicio: filters.fechaInicio ? convertDateFormat(filters.fechaInicio) : undefined,
      fechaFin: filters.fechaFin ? convertDateFormat(filters.fechaFin) : undefined,
    };
    onApplyFilters(formattedFilters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: MovimientoFilterOptions = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
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
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <LuCalendar className="w-4 h-4" />
              Rango de Fechas
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  id="fechaInicio"
                  value={filters.fechaInicio || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  id="fechaFin"
                  value={filters.fechaFin || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <LuPackage className="w-4 h-4" />
              Filtrar por Material
            </div>
            
            <input
              type="text"
              placeholder="Nombre del material..."
              value={filters.materialNombre || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, materialNombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <LuUser className="w-4 h-4" />
              Filtrar por Usuario
            </div>
            
            <input
              type="text"
              placeholder="Nombre del usuario..."
              value={filters.usuario || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, usuario: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Rango de Cantidad
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cantidadMinima" className="block text-sm text-gray-600 mb-1">
                  Cantidad Mínima
                </label>
                <input
                  type="number"
                  id="cantidadMinima"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={filters.cantidadMinima || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    cantidadMinima: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="cantidadMaxima" className="block text-sm text-gray-600 mb-1">
                  Cantidad Máxima
                </label>
                <input
                  type="number"
                  id="cantidadMaxima"
                  min="0"
                  step="1"
                  placeholder="∞"
                  value={filters.cantidadMaxima || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    cantidadMaxima: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          </form>
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
              onClick={handleReset}
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

export default FilterMovimientosModal;