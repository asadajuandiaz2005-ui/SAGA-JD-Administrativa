import React, { useState } from 'react';
import { LuX, LuFilter } from 'react-icons/lu';

type FiltrosProveedor = {
    tipo: 'Todos' | 'Físico' | 'Jurídico';
    estado: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onApply: (f: FiltrosProveedor) => void;
    currentFilters: FiltrosProveedor;
    estadosOptions: string[];
};

const FilterProveedorModal: React.FC<Props> = ({ isOpen, onClose, onApply, currentFilters, estadosOptions }) => {
    const [filters, setFilters] = useState<FiltrosProveedor>(currentFilters);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const clear: FiltrosProveedor = { tipo: 'Todos', estado: 'Todos' };
        setFilters(clear);
        onApply(clear);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-start justify-end z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <LuFilter className="w-5 h-5" />
                        Filtros Avanzados
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <LuX className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div>
                        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Tipo</label>
                        <select
                            id="tipo"
                            value={filters.tipo}
                            onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value as FiltrosProveedor['tipo'] }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Todos">Todos los tipos</option>
                            <option value="Físico">Físico</option>
                            <option value="Jurídico">Jurídico</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">Estado del Proveedor</label>
                        <select
                            id="estado"
                            value={filters.estado}
                            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {estadosOptions.map((est) => (
                                <option key={est} value={est}>{est}</option>
                            ))}
                        </select>
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
        </div>
    );
};

export default FilterProveedorModal;
