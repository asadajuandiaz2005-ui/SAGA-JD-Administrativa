import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import PhoneInputComponent from '@/Modules/Global/components/PhoneInputComponent';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { LuX } from 'react-icons/lu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/Modules/Global/components/Sidebar/ui/alert-dialog';
import {
  EditProveedorJuridicoSchema,
  type EditProveedorJuridicoSchemaData,
  JURIDICO_VALIDATION_LIMITS,
  formatPhoneNumberInput
} from '../Schema/SchemaProveedorJuridico';
import type { ProveedorJuridico, UpdateProveedorJuridicoData } from '../Models/TablaProveedo/tablaJuridicoProveedor';
import { useUpdateProveedorJuridico } from '../Hook/hookjuridicoproveedor';
import { useAlerts } from '@/Modules/Global/context/AlertContext';

interface EditProveedorJuridicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: ProveedorJuridico;
}

const EditProveedorJuridicoModal: React.FC<EditProveedorJuridicoModalProps> = ({
  isOpen,
  onClose,
  proveedor
}) => {
  // Hook de alertas
  const { showSuccess, showError, showWarning } = useAlerts();

  // Hook para actualizar proveedor jurídico
  const {
    updateProveedorJuridico,
    isUpdating
  } = useUpdateProveedorJuridico();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldCharCounts, setFieldCharCounts] = useState({
    Nombre_Proveedor: proveedor.Nombre_Proveedor.length,
    Razon_Social: proveedor.Razon_Social.length,
    Telefono_Proveedor: proveedor.Telefono_Proveedor.length
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Función para validar en tiempo real (solo campos editables)
  const validateFieldRealTime = (fieldName: string, value: string) => {
    let error = '';

    switch (fieldName) {
      case 'Nombre_Proveedor':
        const nombre = value.trim();
        if (nombre && nombre.length >= 2) {
          const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/;
          if (!NOMBRE_REGEX.test(nombre)) {
            error = 'El nombre solo puede contener letras y espacios';
          }
        }
        break;

      case 'Razon_Social':
        const razonSocial = value.trim();
        if (razonSocial && razonSocial.length >= 2) {
          const RAZON_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/;
          if (!RAZON_REGEX.test(razonSocial)) {
            error = 'La razón social solo puede contener letras y espacios';
          }
        }
        break;

      case 'Telefono_Proveedor':
        if (value) {
          if (!isValidPhoneNumber(value)) {
            error = 'Número de teléfono inválido para el país seleccionado';
          }
        }
        break;
    }

    // Actualizar errores en tiempo real
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return error === '';
  };

  // Función para crear el handler de input con validación en tiempo real
  const createInputHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Limitar caracteres al máximo permitido
      if (value.length <= maxLength) {
        handleChange(value);
        setFieldCharCounts(prev => ({ ...prev, [fieldName]: value.length }));

        // Validar en tiempo real
        validateFieldRealTime(fieldName, value);
      }
    };
  };

  // Función para manejar errores de API específicos
  const handleApiError = (error: any) => {
    console.error('❌ Error al actualizar proveedor jurídico:', error);

    // Manejar errores HTTP 409 (conflictos de duplicación) - ALERTAS AMARILLAS
    if (error?.response?.status === 409) {
      const errorMessage = error.response?.data?.message || error.message || '';

      if (errorMessage.toLowerCase().includes('nombre') || errorMessage.toLowerCase().includes('name')) {
        showWarning('⚠️ Ya existe un proveedor con este nombre. Por favor, utiliza un nombre diferente.');
        return;
      }

      if (errorMessage.toLowerCase().includes('razon') || errorMessage.toLowerCase().includes('social')) {
        showWarning('⚠️ Ya existe un proveedor con esta razón social. Por favor, utiliza una razón social diferente.');
        return;
      }

      // Error 409 genérico - también amarillo
      showWarning('⚠️ Ya existe un proveedor con esa información. Por favor, verifica los datos ingresados.');
      return;
    }

    // Otros errores de validación del servidor
    if (error?.response?.status === 400) {
      const errorMessage = error.response?.data?.message || 'Datos inválidos';
      showError(`Error de validación: ${errorMessage}`);
      return;
    }

    // Errores de red o servidor
    if (error?.response?.status >= 500) {
      showError('Error del servidor. Por favor, intenta nuevamente más tarde.');
      return;
    }

    // Error genérico
    const errorMessage = error?.message || 'Error desconocido al actualizar el proveedor jurídico';
    showError(`Error al actualizar el proveedor jurídico: ${errorMessage}`);
  };

  const form = useForm({
    defaultValues: {
      Nombre_Proveedor: proveedor.Nombre_Proveedor,
      Razon_Social: proveedor.Razon_Social,
      Telefono_Proveedor: proveedor.Telefono_Proveedor,
    },
    onSubmit: async ({ value }: { value: EditProveedorJuridicoSchemaData }) => {
      setFormErrors({});

      // Validar usando el schema de Zod simplificado
      const validation = EditProveedorJuridicoSchema.safeParse(value);

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
        // Solo enviar los campos que se pueden actualizar según el DTO del backend
        const payload: UpdateProveedorJuridicoData = {
          Nombre_Proveedor: validation.data.Nombre_Proveedor,
          Razon_Social: validation.data.Razon_Social,
          Telefono_Proveedor: validation.data.Telefono_Proveedor,
        };

        // Usar el hook para actualizar el proveedor jurídico
        await updateProveedorJuridico({
          id: proveedor.Id_Proveedor,
          data: payload
        });

        showSuccess('¡Proveedor jurídico actualizado exitosamente!');
        onClose();
      } catch (error) {
        handleApiError(error);
      }
    },
  });

  // Función para renderizar contador de caracteres
  const renderCharCounter = (current: number, max: number, hasError: boolean) => {
    const remaining = max - current;
    const isNearLimit = remaining <= 5;

    return (
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500">
          {hasError ? '' : `Máximo ${max} caracteres`}
        </span>
        <span className={`text-xs font-medium ${isNearLimit ? 'text-orange-600' : 'text-gray-500'
          }`}>
          {current}/{max}
          {isNearLimit && current < max && (
            <span className="ml-1 text-orange-600">
              ({remaining} restantes)
            </span>
          )}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Editar Proveedor Jurídico</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <LuX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 max-h-[calc(90vh-140px)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Nombre del Proveedor */}
            <form.Field name="Nombre_Proveedor">
              {(field) => (
                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proveedor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={createInputHandler('Nombre_Proveedor', field.handleChange, JURIDICO_VALIDATION_LIMITS.NOMBRE_MAX_LENGTH)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(formErrors.Nombre_Proveedor || field.state.meta.errors?.length)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    placeholder="Ingrese el nombre del proveedor (mín. 2 caracteres)"
                    maxLength={JURIDICO_VALIDATION_LIMITS.NOMBRE_MAX_LENGTH}
                  />

                  {renderCharCounter(
                    fieldCharCounts.Nombre_Proveedor,
                    JURIDICO_VALIDATION_LIMITS.NOMBRE_MAX_LENGTH,
                    !!(formErrors.Nombre_Proveedor || field.state.meta.errors?.length)
                  )}

                  {field.state.meta.errors?.map((err: any) => (
                    <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  {formErrors.Nombre_Proveedor && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.Nombre_Proveedor}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Razón Social */}
            <form.Field name="Razon_Social">
              {(field) => (
                <div>
                  <label className="block text-left text-left text-sm font-medium text-gray-700 mb-1">
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={createInputHandler('Razon_Social', field.handleChange, JURIDICO_VALIDATION_LIMITS.RAZON_SOCIAL_MAX_LENGTH)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(formErrors.Razon_Social || field.state.meta.errors?.length)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    placeholder="Ingrese la razón social (mín. 2 caracteres)"
                    maxLength={JURIDICO_VALIDATION_LIMITS.RAZON_SOCIAL_MAX_LENGTH}
                  />

                  {renderCharCounter(
                    fieldCharCounts.Razon_Social,
                    JURIDICO_VALIDATION_LIMITS.RAZON_SOCIAL_MAX_LENGTH,
                    !!(formErrors.Razon_Social || field.state.meta.errors?.length)
                  )}

                  {field.state.meta.errors?.map((err: any) => (
                    <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  {formErrors.Razon_Social && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.Razon_Social}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Teléfono */}
            <form.Field name="Telefono_Proveedor">
              {(field) => (
                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <PhoneInputComponent
                    value={field.state.value || ''}
                    onChange={(value) => {
                      const formattedValue = formatPhoneNumberInput(value || '');
                      field.handleChange(formattedValue);
                      setFieldCharCounts(prev => ({
                        ...prev,
                        Telefono_Proveedor: formattedValue.length
                      }));
                      validateFieldRealTime('Telefono_Proveedor', value || '');
                    }}
                    onBlur={field.handleBlur}
                    hasError={!!(formErrors.Telefono_Proveedor || field.state.meta.errors?.length)}
                  />

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      Seleccione país y ingrese su número
                    </span>
                    <span className={`text-xs ${(() => {
                        if (field.state.value && isValidPhoneNumber(field.state.value)) {
                          return 'text-green-600';
                        }
                        if (field.state.value) {
                          return 'text-red-600';
                        }
                        return 'text-gray-500';
                      })()
                      }`}>
                      {field.state.value
                        ? (isValidPhoneNumber(field.state.value) ? '✓ Válido' : '✗ Inválido')
                        : 'Pendiente'
                      }
                    </span>
                  </div>

                  {field.state.meta.errors?.map((err: any) => (
                    <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  {formErrors.Telefono_Proveedor && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.Telefono_Proveedor}</p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="flex justify-end gap-3 pt-4">
              <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    disabled={isUpdating}
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${isUpdating
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {isUpdating ? 'Actualizando...' : 'Actualizar Proveedor'}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <span>¿Actualizar proveedor?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <span>¿Estás seguro de que deseas actualizar el proveedor "{form.state.values.Nombre_Proveedor}"?</span>
                      <br />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={() => {
                        setShowConfirmDialog(false);
                        form.handleSubmit();
                      }}
                      disabled={isUpdating}
                    >
                      <span>{isUpdating ? 'Actualizando...' : 'Actualizar'}</span>
                    </AlertDialogAction>
                    <AlertDialogCancel disabled={isUpdating}>
                      <span>Cancelar</span>
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isUpdating}
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

export default EditProveedorJuridicoModal;