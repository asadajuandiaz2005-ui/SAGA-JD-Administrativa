import { useForm } from '@tanstack/react-form';
import { LoginSchema, type LoginData } from '../schema/LoginSchema';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useLogin } from '../Hooks/AuthHook';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { AxiosError } from 'axios';

export default function LoginForm() {
  const mutation = useLogin();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError, showWarning, isBlocked } = useAlerts();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    defaultValues: {
      Nombre_Usuario: '',
      Password: '',
    },

    onSubmit: async ({ value }: { value: LoginData }) => {
      setFormErrors({});

      const validation = LoginSchema.safeParse(value);

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
          await mutation.mutateAsync({
            Nombre_Usuario: value.Nombre_Usuario,
            Password: value.Password,
          });
          showSuccess('Inicio de sesión exitoso');
        } catch (error: unknown) {
          let errorMsg = '';
          if (error instanceof AxiosError) {
            errorMsg = error.response?.data?.message || error.message;
          } else if (error instanceof Error) {
            errorMsg = error.message;
          } else {
            errorMsg = String(error);
          }

          if (typeof errorMsg === 'string' && errorMsg.includes('deshabilitado')) {
            showWarning('El usuario está deshabilitado. Contacta al administrador.');
          } else {
            setFormErrors({
              general: 'Credenciales incorrectas o error en el servidor',
            });
          }
          showError('Error de inicio de sesión');
        }
    },
  });


  const isButtonDisabled = mutation.isPending || isBlocked;

  return (
    <section className="min-h-screen min-w-screen flex bg-gray-100">

      {/* Imagen con overlay y texto */}
      <div className="hidden md:block md:w-[50vw] relative">
        {/* Imagen de fondo */}
        <img
          src="\LoginPhoto.jpg"
          alt="Imagen"
          className="w-full h-full object-cover"
        />
        
        {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Texto sobre la imagen */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-8">
          <h1 className="text-5xl font-bold text-center mb-4 drop-shadow-lg">
            ASADA Juan Díaz
          </h1>
          <p className="text-2xl font-light text-center drop-shadow-md">
            Panel Administrativo
          </p>
        </div>
      </div>

      {/* Formulario */}
      <section className="w-full md:w-[50vw] flex items-center justify-center bg-whitesmoke">
        <div className="w-full max-w-sm p-8 rounded-xl shadow-lg flex flex-col items-center bg-gray-200">
          <div className="w-30 h-30 flex justify-center mb-4">
            <img
              src="/Logo_ASADA_Juan_Díaz.png"
              alt="Logo"
              className="w-full h-full rounded-full"
            />
          </div>

          <h2 className="text-2xl font-bold text-center text-sky-600 mb-6">
            Acceder
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4 w-full"
          >
            <form.Field name="Nombre_Usuario">
              {(field) => (
                <div>
                  <label htmlFor="Nombre_Usuario" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                    <p className="inline text-red-500 pl-1">*</p>
                  </label>
                  <input
                    id="Nombre_Usuario"
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Nombre de Usuario"
                    className="w-full text-black p-2 rounded-md border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {field.state.meta.errors?.map((err) => (
                    <p key={err} className="text-red-500 text-sm">
                      {err}
                    </p>
                  ))}
                  {formErrors.Nombre_Usuario && (
                    <p className="text-red-500 text-sm">
                      {formErrors.Nombre_Usuario}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="Password">
              {(field) => (
                <div className="relative">
                  <label htmlFor="Password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                    <p className="inline text-red-500 pl-1">*</p>
                  </label>
                  <input
                    id="Password"
                    type={showPassword ? "text" : "password"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full text-black p-2 rounded-md border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-9 text-gray-500 hover:text-blue-600"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                  {field.state.meta.errors?.map((err) => (
                    <p key={err} className="text-red-500 text-sm">
                      {err}
                    </p>
                  ))}
                  {formErrors.Password && (
                    <p className="text-red-500 text-sm">
                      {formErrors.Password}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {formErrors.general && (
              <p className="text-red-500 text-sm">{formErrors.general}</p>
            )}

            <div className="flex items-center justify-between mt-4">
              <Link
                to="/ForgotPassword"
                className="text-sm text-gray-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isButtonDisabled
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-70'
                    : 'bg-blue-900 hover:bg-sky-700 text-white hover:shadow-lg'
                }`}
              >
                {mutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando...
                  </span>
                )  : (
                  'Iniciar Sesión'
                  )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </section>
  );
}