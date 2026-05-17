import React, { useEffect, useState } from 'react';
import { LuFilter, LuX } from 'react-icons/lu';

export interface FilterSolicitudesOptions {
    estado: '' | 'Pendiente' | 'Aprobada' | 'Rechazada' | 'En Proceso';
    tipoPersona: '' | 'Físico' | 'Jurídico';
    tipoSolicitud: '' | 'Afiliacion' | 'Desconexion' | 'Cambio de Medidor' | 'Asociado' | 'Agregar Medidor';
    busquedaAvanzada: string;
}

interface FilterSolicitudModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: FilterSolicitudesOptions;
    onApplyFilters: (filters: FilterSolicitudesOptions) => void;
}
const FilterSolicitudModal: React.FC<FilterSolicitudModalProps> = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
    const [filters, setFilters] = useState<FilterSolicitudesOptions>(currentFilters);

    useEffect(() => {
        if (isOpen) setFilters(currentFilters);
    }, [currentFilters, isOpen]);

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleClear = () => {
        const clearFilters: FilterSolicitudesOptions = {
            estado: '',
            tipoPersona: '',
            tipoSolicitud: '',
            busquedaAvanzada: '',
        };
        setFilters(clearFilters);
        onApplyFilters(clearFilters);
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
                        <label htmlFor="tipoPersona" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Persona
                        </label>
                        <select
                            id="tipoPersona"
                            value={filters.tipoPersona}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    tipoPersona: e.target.value as FilterSolicitudesOptions['tipoPersona'],
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos</option>
                            <option value="Físico">Físico</option>
                            <option value="Jurídico">Jurídico</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tipoSolicitud" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Solicitud
                        </label>
                        <select
                            id="tipoSolicitud"
                            value={filters.tipoSolicitud}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    tipoSolicitud: e.target.value as FilterSolicitudesOptions['tipoSolicitud'],
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todas</option>
                            <option value="Afiliacion">Afiliación</option>
                            <option value="Desconexion">Desconexión</option>
                            <option value="Cambio de Medidor">Cambio de Medidor</option>
                            <option value="Asociado">Asociado</option>
                            <option value="Agregar Medidor">Agregar Medidor</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <select
                            id="estado"
                            value={filters.estado}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    estado: e.target.value as FilterSolicitudesOptions['estado'],
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Aprobada">Aprobada</option>
                            <option value="Rechazada">Rechazada</option>
                            <option value="En Proceso">En Proceso</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="busquedaAvanzada" className="block text-sm font-medium text-gray-700 mb-2">
                            Búsqueda Avanzada
                        </label>
                        <input
                            id="busquedaAvanzada"
                            type="text"
                            value={filters.busquedaAvanzada}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    busquedaAvanzada: e.target.value,
                                }))
                            }
                            placeholder="Nombre, cédula, tipo, estado..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 z-10">
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                        <button
                            onClick={handleApply}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Aplicar Filtros
                        </button>
                        <button
                            onClick={handleClear}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Limpiar Todo
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSolicitudModal;