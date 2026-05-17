import { useState } from 'react';
import { LuX, LuFilter } from 'react-icons/lu';
import type { FilterModalProps, AuditoriaFilterOptions } from '../types/AuditoriaTypes';
import { MODULOS, ACCIONES } from '../types/AuditoriaTypes';
import { useUsers } from '@/Modules/Usuarios/Hooks/userHook';

const FilterAuditoriaModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: FilterModalProps) => {
  const [filters, setFilters] = useState<AuditoriaFilterOptions>(currentFilters);
  const { data: users = [], isLoading } = useUsers();
  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearFilters: AuditoriaFilterOptions = {
      modulo: '',
      accion: '',
      mis_auditorias: false,
      por_usuario: 0,
    };
    setFilters(clearFilters);
    onApplyFilters(clearFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <section className="fixed inset-0 flex items-start justify-end z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          {/* Filtro por Módulo */}
          <div>
            <label
              htmlFor="modulo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Módulo
            </label>
            <select
              id="modulo"
              value={filters.modulo || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, modulo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos los módulos</option>
              {MODULOS.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Acción */}
          <div>
            <label
              htmlFor="accion"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Acción
            </label>
            <select
              id="accion"
              value={filters.accion || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, accion: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todas las acciones</option>
              {ACCIONES.map((accion) => (
                <option key={accion} value={accion}>
                  {accion}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Usuario */}
          <div>
            <label  htmlFor="por_usuario" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            {isLoading ? (
              <p className="text-sm text-gray-500">Cargando usuarios...</p>
            ) : 
            <select
              id="por_usuario"
              value={filters.por_usuario ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, por_usuario: Number(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Todos los usuarios</option>
              {users.map((user) => (
                <option key={user.Id_Usuario} value={user.Id_Usuario}>
                  {user.Nombre_Usuario}
                </option>
              ))}
            </select>
            }
          </div>

          {/* Filtro por Mis Auditorías */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mis_auditorias"
              checked={filters.mis_auditorias}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, mis_auditorias: e.target.checked }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mis_auditorias" className="text-sm font-medium text-gray-700">
              Mis Auditorías
            </label>
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
    </section>
  );
};

export default FilterAuditoriaModal;
