import { useState } from 'react';
import { LuX } from 'react-icons/lu';
import { useCreateMedidor } from '../../hooks/useMedidores';
import { CreateMedidorSchema, type CreateMedidorSchemaData } from '../../schema/CreateMedidorSchemas';

interface CreateMedidorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateMedidorModal = ({ isOpen, onClose }: CreateMedidorModalProps) => {
  const createMedidorMutation = useCreateMedidor();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<CreateMedidorSchemaData>({
    Numero_Medidor: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validación con Zod
    const validation = CreateMedidorSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of validation.error.errors) {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      }
      setFormErrors(fieldErrors);
      return;
    }

    try {
      await createMedidorMutation.mutateAsync({
        data: validation.data,
      });
      
      // Resetear formulario
      setFormData({ Numero_Medidor: 0 });
      onClose();
    } catch (error) {
      console.error('Error creating medidor:', error);
    }
  };

  const handleClose = () => {
    setFormData({ Numero_Medidor: 0 });
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Crear Medidor
            </h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label htmlFor="numero-medidor" className="block text-sm font-medium text-gray-700 mb-1">
                Número del Medidor <span className="text-red-500">*</span>
              </label>
              <input
                id="numero-medidor"
                type="text"
                value={formData.Numero_Medidor || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : Number.parseInt(e.target.value);
                  setFormData({ Numero_Medidor: value });
                  if (formErrors.Numero_Medidor) {
                    setFormErrors(prev => ({ ...prev, Numero_Medidor: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono ${
                  formErrors.Numero_Medidor ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: 123456"
                maxLength={8}
                min="1"
                autoComplete="off"
              />
              {formErrors.Numero_Medidor && (
                <p className="text-red-500 text-sm mt-1">{formErrors.Numero_Medidor}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Ingrese un número único para identificar el medidor
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 z-10">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="submit"
                disabled={createMedidorMutation.isPending}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMedidorMutation.isPending ? 'Creando...' : 'Crear Medidor'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMedidorModal;
