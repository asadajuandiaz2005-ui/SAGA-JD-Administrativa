import { useForm } from '@tanstack/react-form';
import { useCreateUser } from '../Hooks/userHook';
import type { CreateUserData } from '../Models/Usuario';
import { useState } from 'react';
import { CreateUserSchema, type CreateUserSchemaData } from '../Schema/CreateUserSchema';
import type { Role } from '@/Modules/Roles/Models/Role';
import { useRoles } from '@/Modules/Roles/Hooks/RoleHook';
import { type CreateUserProps, NOMBRE_MAX_LENGTH, EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../Types/UserTypes';
import { LuEye, LuEyeOff } from 'react-icons/lu';




const CreateUserModal = ({ onClose, setShowCreateModal }: CreateUserProps) => {
  const createUserMutation = useCreateUser();
  const { data: roles = [] } = useRoles();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldCharCounts, setFieldCharCounts] = useState({
    nombreUsuario: 0,
    email: 0,
    password: 0,
    confirmPassword: 0
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    if (setShowCreateModal) setShowCreateModal(false);
  };


  // Función para crear el handler de input con validación
  const createInputHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
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
      Nombre_Usuario: '',
      Correo_Electronico: '',
      Contraseña: '',
      confirmarPassword: '',
      Id_Rol: 0,
    },

    onSubmit: async ({ value }: { value: CreateUserSchemaData }) => {
      setFormErrors({});

      const validation = CreateUserSchema.safeParse(value);

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

        const payload : CreateUserData = {
          Nombre_Usuario: value.Nombre_Usuario,
          Contraseña: value.Contraseña,
          Correo_Electronico: value.Correo_Electronico,
          Id_Rol: value.Id_Rol
        };

        await createUserMutation.mutateAsync({ userData: payload});
        handleClose();
        form.reset();
      } catch (error) {
        console.error('Error creating user:', error);
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


  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <h2 className="text-xl font-semibold text-gray-900">Registrar un nuevo usuario</h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            id="create-user-form"
            className="space-y-4"
          >
            {/* Nombre de Usuario */}
            <form.Field name="Nombre_Usuario">
              {(field) => (
                <div>
                  <label htmlFor="Nombre_Usuario" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    id="Nombre_Usuario"
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

            {/* Correo Electrónico */}
            <form.Field name="Correo_Electronico">
              {(field) => (
                <div>
                  <label htmlFor="Correo_Electronico" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    id="Correo_Electronico"
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

            {/* Contraseña */}
            <form.Field name="Contraseña">
              {(field) => (
                <div>
                  <label htmlFor="Contraseña" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="Contraseña"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onChange={createInputHandler('password', field.handleChange, PASSWORD_MAX_LENGTH)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                        (formErrors.Contraseña || field.state.meta.errors?.length) 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
                      maxLength={PASSWORD_MAX_LENGTH}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {renderCharCounter(
                    fieldCharCounts.password, 
                    PASSWORD_MAX_LENGTH, 
                    !!(formErrors.Contraseña || field.state.meta.errors?.length)
                  )}
                
                  {field.state.meta.errors?.map((err) => (
                    <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  {formErrors.Contraseña && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.Contraseña}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Confirmar Contraseña */}
            <form.Field name="confirmarPassword">
              {(field) => (
                <div>
                  <label htmlFor="confirmarPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirme la Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmarPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={field.state.value}
                      onChange={createInputHandler('confirmPassword', field.handleChange, PASSWORD_MAX_LENGTH)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                        (formErrors.confirmarPassword || field.state.meta.errors?.length) 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Repita su contraseña"
                      maxLength={PASSWORD_MAX_LENGTH}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {renderCharCounter(
                    fieldCharCounts.confirmPassword, 
                    PASSWORD_MAX_LENGTH, 
                    !!(formErrors.confirmarPassword || field.state.meta.errors?.length)
                  )}

                  {field.state.meta.errors?.map((err) => (
                    <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  {formErrors.confirmarPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmarPassword}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Rol */}
            <form.Field name="Id_Rol">
              {(field) => (
                <div>
                  <label htmlFor="Id_Rol" className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    id="Id_Rol"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                      (formErrors.id_rol || field.state.meta.errors?.length) 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value={0}>Seleccionar rol</option>
                    {roles.map((rol: Role) => (
                      <option key={rol.Id_Rol} value={rol.Id_Rol}>
                        {rol.Nombre_Rol}
                      </option>
                    ))}
                  </select>
                  {field.state.meta.errors?.map((err) => (
                    <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                  ))}
                  {formErrors.id_rol && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.id_rol}</p>
                  )}
                </div>
              )}
            </form.Field>
          </form>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
          <button
            type="submit"
            form="create-user-form"
            disabled={createUserMutation.isPending}
            className={`flex-1 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              createUserMutation.isPending 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700' 
            }`}
          >
            {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;