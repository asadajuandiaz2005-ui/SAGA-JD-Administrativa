import { useEffect, useState } from "react";
import { LuFilter, LuX } from "react-icons/lu";
import type { LecturaFilterOptions } from "../model/LecturaFilters";

interface FilterSelectOption {
  id: number;
  label: string;
}

interface FilterLecturaModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onApplyFilters: (filters: LecturaFilterOptions) => void;
  readonly currentFilters: LecturaFilterOptions;
  readonly usuarioOptions: FilterSelectOption[];
  readonly afiliadoOptions: FilterSelectOption[];
  readonly isLoadingUsuarios?: boolean;
  readonly isLoadingAfiliados?: boolean;
}

const emptyFilters: LecturaFilterOptions = {
  idUsuario: undefined,
  numeroMedidor: undefined,
  idAfiliado: undefined,
  fechaInicio: undefined,
  fechaFin: undefined,
};

export default function FilterLecturaModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  usuarioOptions,
  afiliadoOptions,
  isLoadingUsuarios = false,
  isLoadingAfiliados = false,
}: FilterLecturaModalProps) {
  const [filters, setFilters] = useState<LecturaFilterOptions>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
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
            <label htmlFor="idUsuario" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <select
              id="idUsuario"
              value={filters.idUsuario ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  idUsuario: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              disabled={isLoadingUsuarios}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">{isLoadingUsuarios ? "Cargando usuarios..." : "Todos los usuarios"}</option>
              {usuarioOptions.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.label}
                </option>
              ))}
            </select>
            {!isLoadingUsuarios && usuarioOptions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">No hay usuarios disponibles.</p>
            )}
          </div>

          <div>
            <label htmlFor="numeroMedidor" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Medidor
            </label>
            <input
              id="numeroMedidor"
              type="number"
              min="1"
              value={filters.numeroMedidor ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  numeroMedidor: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Ej: 12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label htmlFor="idAfiliado" className="block text-sm font-medium text-gray-700 mb-2">
              Afiliado
            </label>
            <select
              id="idAfiliado"
              value={filters.idAfiliado ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  idAfiliado: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              disabled={isLoadingAfiliados}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">{isLoadingAfiliados ? "Cargando afiliados..." : "Todos los afiliados"}</option>
              {afiliadoOptions.map((afiliado) => (
                <option key={afiliado.id} value={afiliado.id}>
                  {afiliado.label}
                </option>
              ))}
            </select>
            {!isLoadingAfiliados && afiliadoOptions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">No hay afiliados disponibles.</p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Rango de Fechas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fechaInicio" className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha Inicio
                </label>
                <input
                  id="fechaInicio"
                  type="date"
                  value={filters.fechaInicio ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fechaInicio: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label htmlFor="fechaFin" className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha Fin
                </label>
                <input
                  id="fechaFin"
                  type="date"
                  value={filters.fechaFin ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fechaFin: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
  );
}
