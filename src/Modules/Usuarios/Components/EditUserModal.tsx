import { useForm } from '@tanstack/react-form';
import { useUpdateUser } from '../Hooks/userHook';
import type { UpdateUserData } from '../Models/Usuario';
import { useRoles } from '@/Modules/Roles/Hooks/RoleHook';
import { EMAIL_MAX_LENGTH, NOMBRE_MAX_LENGTH, type EditUserModalProps } from '../Types/UserTypes';
import { useState, useEffect } from 'react';
import { UpdateUserSchema, type UpdateUserSchemaData } from '../Schema/UpdateUserSchema';
import type { Role } from '@/Modules/Roles/Models/Role';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";
import { Button } from '@/Modules/Global/components/Sidebar/ui/button';


const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, usert }) => {
  const updateUserMutation = useUpdateUser();
  const { data: roles = [] } = useRoles();
  const activeRoles = roles.filter((rol: Role) => rol.Fecha_Eliminacion === null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldCharCounts, setFieldCharCounts] = useState({
    nombreUsuario: usert.Nombre_Usuario?.length || 0,
    email: usert.Correo_Electronico?.length || 0
  });


      const createInputHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Limitar caracteres al máximo permitido
      if (value.length <= maxLength) {
        handleChange(value);
        setFieldCharCounts(prev => ({ ...prev, [fieldName]: value.length }));
        
        if (formErrors[fieldName]) {
          setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
      }
    };
  };

  const form = useForm({
    defaultValues: {
      Nombre_Usuario: usert.Nombre_Usuario,
      Correo_Electronico: usert.Correo_Electronico,
      Contraseña: '',
      Id_Rol: usert.Rol?.Id_Rol || 0,
    },
    onSubmit: async ({ value }: { value: UpdateUserSchemaData }) => {
      setFormErrors({});
  
        const validation = UpdateUserSchema.safeParse(value);
  
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
        const updateData: UpdateUserData = {
          Nombre_Usuario: value.Nombre_Usuario,
          Correo_Electronico: value.Correo_Electronico,
          Id_Rol: value.Id_Rol
        };

        await updateUserMutation.mutateAsync({ Id_Usuario: usert.Id_Usuario, userData: updateData });
        onClose();
      } catch (error) {
        console.error('Error updating user:', error);
      }
    },
  });

  // Actualizar los contadores cuando cambie el usuario
  useEffect(() => {
    if (isOpen && usert) {
      setFieldCharCounts({
        nombreUsuario: usert.Nombre_Usuario?.length || 0,
        email: usert.Correo_Electronico?.length || 0
      });
      
      setFormErrors({});
    }
  }, [usert?.Id_Usuario, isOpen]);

  const renderCharCounter = (current: number, max: number, hasError: boolean) => {
    const remaining = max - current;
    const isNearLimit = remaining <= 5;
    
    return (
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500">
          {hasError ? '' : `Máximo ${max} caracteres`}
        </span>
        <span className={`text-xs font-medium ${
          isNearLimit ? 'text-orange-600' : 'text-gray-500'
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
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Editar Usuario</h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <form
            key={usert.Id_Usuario}
            id="edit-user-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="p-6 space-y-4"
          >
          <form.Field name="Nombre_Usuario">
            {(field) => (
              <div>
                <label htmlFor='Nombre_Usuario' className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  id='Nombre_Usuario'
                  type="text"
                  value={field.state.value}
                  onChange={createInputHandler('nombreUsuario', field.handleChange, NOMBRE_MAX_LENGTH)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    (formErrors.Nombre_Usuario || field.state.meta.errors?.length) 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder={`Nombre de Usuario`}
                  maxLength={NOMBRE_MAX_LENGTH}
                />
                
                {renderCharCounter(
                  fieldCharCounts.nombreUsuario, 
                  NOMBRE_MAX_LENGTH, 
                  !!(formErrors.Nombre_Usuario || field.state.meta.errors?.length)
                )}

                {field.state.meta.errors?.map((err) => (
                  <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                ))}
                {formErrors.Nombre_Usuario && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.Nombre_Usuario}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="Correo_Electronico">
            {(field) => (
              <div>
                <label htmlFor='Correo_Electronico' className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  id='Correo_Electronico'
                  type="email"
                  value={field.state.value}
                  onChange={createInputHandler('email', field.handleChange, EMAIL_MAX_LENGTH)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    (formErrors.Correo_Electronico || field.state.meta.errors?.length) 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="ejemplo@correo.com"
                  maxLength={EMAIL_MAX_LENGTH}
                />
                
                {renderCharCounter(
                  fieldCharCounts.email, 
                  EMAIL_MAX_LENGTH, 
                  !!(formErrors.Correo_Electronico || field.state.meta.errors?.length)
                )}
                
                {field.state.meta.errors?.map((err) => (
                  <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                ))}
                {formErrors.Correo_Electronico && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.Correo_Electronico}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="Id_Rol">
            {(field) => (
              <div>
                <label htmlFor='Id_Rol' className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  id='Id_Rol'
                  value={field.state.value}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    field.handleChange(newValue);
                    if (formErrors.Id_Rol) {
                      setFormErrors(prev => ({ ...prev, Id_Rol: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    (formErrors.Id_Rol || field.state.meta.errors?.length) 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value={0}>Seleccionar rol</option>
                  {activeRoles.map((rol: Role) => (
                    <option key={rol.Id_Rol} value={rol.Id_Rol}>
                      {rol.Nombre_Rol}
                    </option>
                  ))}
                </select>
                {field.state.meta.errors?.map((err) => (
                  <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                ))}
                {formErrors.Id_Rol && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.Id_Rol}</p>
                )}
              </div>
            )}
          </form.Field>
        </form>
        </div>
          
          <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  form="edit-user-form"
                  disabled={updateUserMutation.isPending}
                  className={`flex-1 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    updateUserMutation.isPending 
                        ? 'bg-blue-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700' 
                  }`}
                >
                  {updateUserMutation.isPending ? 'Actualizando...' : 'Actualizar Usuario'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar actualización?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que deseas actualizar este usuario? Esta acción modificará la información del usuario en el sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    onClick={() => form.handleSubmit()}
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? 'Actualizando...' : 'Confirmar'}
                  </AlertDialogAction>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
      </div>
    </div>
  );
};

export default EditUserModal;