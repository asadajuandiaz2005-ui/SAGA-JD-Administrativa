import React, { useState } from 'react';
import { LuX } from 'react-icons/lu';
import { useCreateCategoria } from '../../hooks/useCategorias';
import { CreateCategoriaMaterialSchema, type CreateCategoriaMaterialSchemaData } from '../../schema/CreateCategoriaMaterialSchema';

interface CreateCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const CreateCategoriaModal: React.FC<CreateCategoriaModalProps> = ({ isOpen, onClose }) => {
  const createCategoriaMutation = useCreateCategoria();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [charCount, setCharCount] = useState({ name: 0, description: 0 });
  const MAX_NAME_LENGTH = 30;
  const MAX_DESC_LENGTH = 100;
  
  const [formData, setFormData] = useState<CreateCategoriaMaterialSchemaData>({
    Nombre_Categoria: '',
    Descripcion_Categoria: ''

  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const maxLength = name === 'Nombre_Categoria' ? MAX_NAME_LENGTH : MAX_DESC_LENGTH;
    
    if (value.length <= maxLength) {
      setFormData(prev => ({ ...prev, [name]: value }));
      setCharCount(prev => ({
        ...prev,
        [name === 'Nombre_Categoria' ? 'name' : 'description']: value.length
      }));
      
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const dataToValidate = {
      Nombre_Categoria: formData.Nombre_Categoria.trim(),
      Descripcion_Categoria: formData.Descripcion_Categoria?.trim()
    };

    const validation = CreateCategoriaMaterialSchema.safeParse(dataToValidate);

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
      await createCategoriaMutation.mutateAsync({
        data: validation.data,
      });
      setFormData({ Nombre_Categoria: '', Descripcion_Categoria: '' });
      setCharCount({ name: 0, description: 0 });
      onClose();
    } catch (error) {
      console.error('Error creating categoria:', error);
      setFormErrors({ Nombre_Categoria: 'Error al crear la categoría' });
    }
  };

  const renderCharCounter = (current: number, max: number) => {
    const remaining = max - current;
    const isNearLimit = remaining <= 5;
    
    return (
      <div className="flex justify-end items-center mt-1">
        <span className={`text-xs font-medium ${
          isNearLimit ? 'text-orange-600' : 'text-gray-500'
        }`}>
          {current}/{max}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Categoría</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <LuX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre-categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Categoría <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre-categoria"
                name="Nombre_Categoria"
                type="text"
                value={formData.Nombre_Categoria}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  formErrors.Nombre_Categoria ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: Tuberías, Herramientas, Químicos"
                autoComplete="off"
              />
              {renderCharCounter(charCount.name, MAX_NAME_LENGTH)}
              {formErrors.Nombre_Categoria && (
                <p className="text-red-500 text-sm mt-1">{formErrors.Nombre_Categoria}</p>
              )}
            </div>

            <div>
              <label htmlFor="descripcion-categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de la Categoría
              </label>
              <textarea
                id="descripcion-categoria"
                name="Descripcion_Categoria"
                value={formData.Descripcion_Categoria}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  formErrors.Descripcion_Categoria ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe el tipo de materiales que incluye esta categoría"
              />
              {renderCharCounter(charCount.description, MAX_DESC_LENGTH)}
              {formErrors.Descripcion_Categoria && (
                <p className="text-red-500 text-sm mt-1">{formErrors.Descripcion_Categoria}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={createCategoriaMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createCategoriaMutation.isPending ? 'Creando...' : 'Crear Categoría'}
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
    </div>
  );
};

export default CreateCategoriaModal;