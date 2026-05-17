import React, { useState } from 'react';
import { LuTrendingDown, LuTriangleAlert } from 'react-icons/lu';
import { IngresoEgresoMaterialSchema } from '../../schema/MaterialMovimientoSchema';
import type { Material, IngresoEgresoMaterialData } from '../../models/Inventario';
import { useEgresoMaterial } from '../../hooks/useMovimientos';


interface EgresoMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

const EgresoMaterialModal: React.FC<EgresoMaterialModalProps> = ({
  isOpen,
  onClose,
  material
}) => {

  const egresoMutation = useEgresoMaterial();
  const [formData, setFormData] = useState<IngresoEgresoMaterialData>({
    Id_Material: material.Id_Material,
    Cantidad: 1
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setFormData(prev => ({ ...prev, Cantidad: value }));
      if (formErrors.Cantidad) {
        setFormErrors(prev => ({ ...prev, Cantidad: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

   
    const validation = IngresoEgresoMaterialSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

   
    if (formData.Cantidad > material.Cantidad) {
      setFormErrors({ Cantidad: 'La cantidad no puede ser mayor al stock disponible' });
      return;
    }

    try {


      await egresoMutation.mutateAsync(formData);
    
      setFormData({ Id_Material: material.Id_Material, Cantidad: 1 });
      onClose();
    } catch (error) {
      console.error('Error al realizar egreso:', error);
      setFormErrors({ Cantidad: 'Error al realizar el egreso' });
    }
  };

  const stockInsuficiente = material.Cantidad === 0;
  const stockRestante = material.Cantidad - formData.Cantidad;
  const seAgotara = stockRestante === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <LuTrendingDown className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Egreso de Material
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Material Seleccionado</h3>
            <p className="text-lg font-semibold text-gray-900">{material.Nombre_Material}</p>
            <p className="text-sm text-gray-600">
              Stock actual: {material.Cantidad} {material.Unidad_Medicion.Nombre_Unidad_Medicion}
            </p>
          </div>

          {stockInsuficiente && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <LuTriangleAlert className="text-red-600" size={20} />
                <p className="text-red-700 text-sm font-medium">
                  No hay stock disponible para este material
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a Egresar <span className="text-red-500">*</span>
            </label>
            <input
              id="cantidad"
              type="number"
              min="1"
              max={material.Cantidad}
              value={formData.Cantidad}
              onChange={handleInputChange}
              disabled={stockInsuficiente}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                formErrors.Cantidad ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${stockInsuficiente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ingrese la cantidad"
              autoComplete="off"
            />
            {formErrors.Cantidad && (
              <p className="text-red-500 text-sm mt-1">{formErrors.Cantidad}</p>
            )}
          </div>

          {!stockInsuficiente && (
            <div className="text-sm text-gray-600">
              <p>Stock después del egreso:</p>
              <p className={`font-semibold ${seAgotara ? 'text-red-600' : 'text-orange-600'}`}>
                {stockRestante} {material.Unidad_Medicion.Nombre_Unidad_Medicion}
                {seAgotara && ' (Material se agotará)'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={egresoMutation.isPending || stockInsuficiente}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {egresoMutation.isPending ? 'Procesando...' : 'Realizar Egreso'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EgresoMaterialModal;
