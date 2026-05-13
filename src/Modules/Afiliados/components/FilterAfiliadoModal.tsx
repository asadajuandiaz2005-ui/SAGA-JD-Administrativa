import React, { useState } from 'react';
import { LuX, LuFilter } from 'react-icons/lu';

export interface FilterOptions {
    estado: 'activo' | 'inactivo' | 'En Espera' | '';
    tipoPersona: 'Físico' | 'Jurídico' | '';
    tipoAfiliado: 'Abonado' | 'Asociado' | '';
    busquedaAvanzada: string;
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: FilterOptions) => void;
    currentFilters: FilterOptions;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApplyFilters, currentFilters }) => {
    const [filters, setFilters] = useState<FilterOptions>(currentFilters);

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleClear = () => {
        const clearFilters: FilterOptions = {
            estado: '',
            tipoPersona: '',
            tipoAfiliado: '',
            busquedaAvanzada: ''
        };
        setFilters(clearFilters);
        onApplyFilters(clearFilters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-start justify-end z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <LuFilter className="w-5 h-5" />
                        Filtros Avanzados
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <LuX className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">

                    {/* Filtro por Tipo de Persona */}
                    <div>
                        <label htmlFor="tipoPersona" className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Tipo
                        </label>
                        <select
                            id="tipoPersona"
                            value={filters.tipoPersona || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, tipoPersona: e.target.value as 'Físico' | 'Jurídico' | '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="Físico">Físico</option>
                            <option value="Jurídico">Jurídico</option>
                        </select>
                    </div>

                    {/* Filtro por Tipo de Afiliado */}
                    <div>
                        <label htmlFor="tipoAfiliado" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Afiliado
                        </label>
                        <select
                            id="tipoAfiliado"
                            value={filters.tipoAfiliado || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, tipoAfiliado: e.target.value as 'Abonado' | 'Asociado' | '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los afiliados</option>
                            <option value="Abonado">Abonado</option>
                            <option value="Asociado">Asociado</option>
                        </select>
                    </div>

                    {/* Filtro por Estado */}
                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                            Estado del Afiliado
                        </label>
                        <select
                            id="estado"
                            value={filters.estado || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value as 'activo' | 'inactivo' | 'En Espera' | '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos</option>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="En Espera">En Espera</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
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
        </div>
    );
};

export default FilterModal;
