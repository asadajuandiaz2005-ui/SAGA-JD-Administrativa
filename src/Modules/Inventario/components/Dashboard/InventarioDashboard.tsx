import React from 'react';
import { LuPackage, LuTags, LuRuler, LuActivity } from 'react-icons/lu';
import { FaBoxes } from 'react-icons/fa';

interface InventarioDashboardProps {
  onNavigate: (section: string) => void;
}

export const InventarioDashboard: React.FC<InventarioDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-7 p-4 md:p-0 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <FaBoxes className="w-8 h-8 md:w-12 md:h-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Gestión del Inventario
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
          Gestión integral de materiales, categorías, unidades de medición, medidores y movimientos de inventario.
        </p>
      </div>

      <div className="px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto">
          <button
            className="p-4 md:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md bg-blue-50 border-blue-200 hover:scale-105 w-full text-left"
            onClick={() => onNavigate('materiales')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-blue-600">
                    <LuPackage className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Materiales
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 text-xs md:text-sm leading-relaxed">
                  Gestión completa del catálogo de materiales, inventario y stock disponible
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium text-blue-600">
                    Ver catálogo completo
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            className="p-4 md:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md bg-green-50 border-green-200 hover:scale-105 w-full text-left"
            onClick={() => onNavigate('categorias')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-green-600">
                    <LuTags className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Categorías
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 text-xs md:text-sm leading-relaxed">
                  Organización y clasificación de materiales por categorías
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium text-green-600">
                    Gestionar clasificaciones
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            className="p-4 md:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md bg-purple-50 border-purple-200 hover:scale-105 w-full text-left"
            onClick={() => onNavigate('unidades')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-purple-600">
                    <LuRuler className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Unidades de Medición
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 text-xs md:text-sm leading-relaxed">
                  Configuración de unidades de medida para materiales
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium text-purple-600">
                    Configurar medidas
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            className="p-4 md:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md bg-orange-50 border-orange-200 hover:scale-105 w-full text-left"
            onClick={() => onNavigate('movimientos')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-orange-600">
                    <LuActivity className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Movimientos
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 text-xs md:text-sm leading-relaxed">
                  Registro de entradas y salidas de inventario
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium text-orange-600">
                    Ver historial completo
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};