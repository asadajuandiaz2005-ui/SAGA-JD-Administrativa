import React from 'react';
import { LuPlus, LuMinus } from 'react-icons/lu';
import type { MovimientoTypeIconProps } from '../../../types/MovimientoTypes';

const MovimientoTypeSelector: React.FC<MovimientoTypeIconProps> = ({ 
  tipoMovimiento, 
  setTipoMovimiento 
}) => (
  <div>
    <div className="block text-sm font-medium text-gray-700 mb-3">
      Tipo de Movimiento
    </div>
    <div className="flex gap-4">
      <button
        onClick={() => setTipoMovimiento('entrada')}
        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
          tipoMovimiento === 'entrada'
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <LuPlus className="w-6 h-6 mx-auto mb-1" />
        <span className="block text-sm font-medium">Entrada</span>
      </button>
      <button
        onClick={() => setTipoMovimiento('salida')}
        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
          tipoMovimiento === 'salida'
            ? 'border-red-500 bg-red-50 text-red-700'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <LuMinus className="w-6 h-6 mx-auto mb-1" />
        <span className="block text-sm font-medium">Salida</span>
      </button>
    </div>
  </div>
);

export default MovimientoTypeSelector;