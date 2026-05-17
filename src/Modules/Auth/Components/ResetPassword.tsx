import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { passwordSchema, type NewPasswordData } from "../schema/NewPasswordSchema";
import { useResetPassword } from "../Hooks/AuthHook";
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import { FiEye, FiEyeOff } from "react-icons/fi";


export default function ResetPassword() {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useAlerts();
  const resetPasswordMutation = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      nuevaContraseña: "",
      confirmarContraseña: "",
    },
    onSubmit: async ({ value }: { value: NewPasswordData }) => {
      setFormErrors({});
      const validation = passwordSchema.safeParse(value);

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
        await resetPasswordMutation.mutateAsync({ nuevaContraseña: value.nuevaContraseña });
        // Mostrar alerta de éxito
        showSuccess(
          "¡Contraseña actualizada!",
          "Tu contraseña ha sido actualizada correctamente.",
          3000
        );
      } catch (err: unknown) {
        console.error("Error updating password:", err);
                // Mostrar alerta de error
        showError(
          "Error al actualizar contraseña",
          "No se pudo actualizar la contraseña. Por favor, intenta de nuevo.",
          3000
        );
        setFormErrors({
          general: "Error al actualizar la contraseña. Intenta de nuevo.",
        });
      }
    },
  });

  return (
    <div className="min-h-screen min-w-screen flex bg-gray-100">
      {/* Imagen - Solo visible en tablet y desktop */}
      <div className="hidden md:block md:w-[50vw] bg-cover bg-center">
        <img
          src="/ASADA_JUAN_D.png"
          alt="Imagen"
          className="w-full h-full object-cover rounded-xl shadow-2xl"
        />
      </div>

      {/* Formulario */}
      <div className="w-full md:w-[50vw] flex items-center justify-center bg-whitesmoke">
        <div className="w-full max-w-sm p-8 rounded-xl shadow-lg flex flex-col items-center bg-gray-200">
          {/* Logo arriba */}
          <div className="w-30 h-30 flex justify-center mb-4">
            <img
              src="/Logo_ASADA_Juan_Díaz.png"
              alt="Logo"
              className="w-full h-full rounded-full"
            />
          </div>

          <h2 className="text-2xl font-bold text-center text-sky-600 mb-6">
            Crear nueva contraseña
          </h2>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Ingresa tu nueva contraseña para continuar
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4 w-full"
          >
            <form.Field name="nuevaContraseña">
              {(field) => (
                <div className="relative">
                  <label htmlFor="nuevaContraseña" className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nuevaContraseña"
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
                  {formErrors.nuevaContraseña && (
                    <p className="text-red-500 text-sm">
                      {formErrors.nuevaContraseña}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="confirmarContraseña">
              {(field) => (
                <div className="relative">
                  <label htmlFor="confirmarContraseña" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmarContraseña"
                    type={showConfirmPassword ? "text" : "password"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Confirme la contraseña"
                    className="w-full text-black p-2 rounded-md border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-9 text-gray-500 hover:text-blue-600"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                  {field.state.meta.errors?.map((err) => (
                    <p key={err} className="text-red-500 text-sm">
                      {err}
                    </p>
                  ))}
                  {formErrors.confirmarContraseña && (
                    <p className="text-red-500 text-sm">
                      {formErrors.confirmarContraseña}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {formErrors.general && (
              <p className="text-red-500 text-sm">{formErrors.general}</p>
            )}

            <button
              type="submit"
              disabled={form.state.isSubmitting}
              className="bg-blue-900 hover:bg-sky-700 text-white px-4 py-2 rounded-full text-sm w-full"
            >
              {form.state.isSubmitting ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            <Link to="/Login" className="text-blue-600 hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}