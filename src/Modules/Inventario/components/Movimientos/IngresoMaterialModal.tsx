import React, { useState } from 'react';
import { LuTrendingUp } from 'react-icons/lu';
import { IngresoEgresoMaterialSchema } from '../../schema/MaterialMovimientoSchema';
import type { Material, IngresoEgresoMaterialData } from '../../models/Inventario';
import { useIngresoMaterial } from '../../hooks/useMovimientos';

interface IngresoMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

const IngresoMaterialModal: React.FC<IngresoMaterialModalProps> = ({
  isOpen,
  onClose,
  material
}) => {
  const ingresoMutation = useIngresoMaterial();
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

    // Use Zod schema validation
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

    try {

      await ingresoMutation.mutateAsync(formData);
      setFormData({ Id_Material: material.Id_Material, Cantidad: 1 });
      onClose();
    } catch (error) {
      console.error('Error al realizar ingreso:', error);
      setFormErrors({ Cantidad: 'Error al realizar el ingreso' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <LuTrendingUp className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Ingreso de Material
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

          <div>
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a Ingresar <span className="text-red-500">*</span>
            </label>
            <input
              id="cantidad"
              type="number"
              min="1"
              value={formData.Cantidad}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                formErrors.Cantidad ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ingrese la cantidad"
              autoComplete="off"
            />
            {formErrors.Cantidad && (
              <p className="text-red-500 text-sm mt-1">{formErrors.Cantidad}</p>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p>Nuevo stock después del ingreso:</p>
            <p className="font-semibold text-green-600">
              {material.Cantidad + formData.Cantidad} {material.Unidad_Medicion.Nombre_Unidad_Medicion}
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={ingresoMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {ingresoMutation.isPending ? 'Procesando...' : 'Realizar Ingreso'}
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

export default IngresoMaterialModal;
