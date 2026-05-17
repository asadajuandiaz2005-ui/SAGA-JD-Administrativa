import React from 'react';
import { LuPlus, LuMinus } from 'react-icons/lu';
import type { CantidadControlProps } from '../../../types/MovimientoTypes';
import { CANTIDAD_MOVIMIENTO_MIN, CANTIDAD_MOVIMIENTO_MAX } from '../../../types/MovimientoTypes';

const CantidadControl: React.FC<CantidadControlProps> = ({
  cantidad,
  selectedMaterial,
  onCantidadChange,
  onDirectCantidadChange
}) => {
  const handleInputChange = (value: string) => {
    const numValue = Number.parseInt(value);
    if (!Number.isNaN(numValue) && numValue >= CANTIDAD_MOVIMIENTO_MIN && numValue <= CANTIDAD_MOVIMIENTO_MAX) {
      onDirectCantidadChange(numValue);
    } else if (value === '') {
      onDirectCantidadChange(CANTIDAD_MOVIMIENTO_MIN);
    }
  };

  return (
    <div>
      <label htmlFor="cantidad-input" className="block text-sm font-medium text-gray-700 mb-3">
        Cantidad {selectedMaterial && `(${selectedMaterial.Unidad_Medicion.Abreviatura})`}
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onCantidadChange(-1)}
          disabled={cantidad <= CANTIDAD_MOVIMIENTO_MIN}
          className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LuMinus className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <input
            id="cantidad-input"
            type="number"
            min={CANTIDAD_MOVIMIENTO_MIN}
            max={CANTIDAD_MOVIMIENTO_MAX}
            value={cantidad}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-medium"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            Rango: {CANTIDAD_MOVIMIENTO_MIN.toLocaleString()} - {CANTIDAD_MOVIMIENTO_MAX.toLocaleString()}
          </div>
        </div>
        <button
          onClick={() => onCantidadChange(1)}
          disabled={cantidad >= CANTIDAD_MOVIMIENTO_MAX}
          className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LuPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CantidadControl;