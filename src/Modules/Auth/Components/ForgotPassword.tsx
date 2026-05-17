import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import {  useState } from 'react';
import { useForgotPassword } from '../Hooks/AuthHook';
import { ForgotPasswordSchema, type ForgotPasswordData } from '../schema/ForgotPasswordSchema';
import { useAlerts } from '@/Modules/Global/context/AlertContext';

export default function ForgotPassword() {
  const mutation = useForgotPassword();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useAlerts(); 
  const form = useForm({
    defaultValues: {
        email: ''
    },

    onSubmit: async ({ value }: { value: ForgotPasswordData }) => {
      setFormErrors({});

      const validation = ForgotPasswordSchema.safeParse(value);

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
        await mutation.mutateAsync({ Email: value.email });
        showSuccess('Correo enviado', 'Revisa tu correo para restablecer tu contraseña', 5000);
      } catch (err: unknown) {
        showError('Error en el servidor o del correo', 'Por favor, inténtelo de nuevo más tarde', 5000);
        setFormErrors({
          general: 'Ingrese un correo electrónico válido',
        });
      }
    },
  });

  return (
    <section className="min-h-screen min-w-screen flex bg-gray-100">

      <div className="hidden md:block w-[50vw] bg-cover bg-center">
        <img
          src="\ASADA_JUAN_D.png"
          alt="Imagen"
          className="w-full h-full object-cover rounded-xl shadow-2xl"
        />
      </div>

      {/* Formulario */}
      <div className="w-full md:w-[50vw] flex items-center justify-center bg-whitesmoke">
        <div className="w-full max-w-sm min-h-[400px] p-8 rounded-xl shadow-lg flex flex-col justify-center items-center bg-gray-200">

          <h2 className="text-2xl font-bold text-center text-sky-600 mb-6">
            Restablecer Contraseña
          </h2>

          <p className="text-gray-600 text-sm text-center mb-6">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4 w-full "
          >
            <form.Field name="email">
              {(field) => (
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                    <p className="inline text-red-500 pl-1">*</p>
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Correo Electrónico"
                    className="w-full text-black p-2 rounded-md border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="flex items-center justify-between mt-2">
              <Link
                to="/Login"
                className="text-sm text-gray-800 hover:underline"
              >
                Volver
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-900 hover:bg-sky-700 text-white px-4 py-2 rounded-full text-sm"
              >
                {mutation.isPending ? 'Cargando...' : 'Restablecer Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
