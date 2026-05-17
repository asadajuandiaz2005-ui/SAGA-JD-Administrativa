import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useAfiliadosFisicos } from '../Hook/HookAfiliadoFisico';
import { useAfiliadosJuridicos } from '../Hook/HookAfiliadoJuridico';
import { User, X, Building2 } from 'lucide-react';

interface FormularioAfiliadosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormularioAfiliados({ isOpen, onClose, onSuccess }: FormularioAfiliadosProps) {
  const [tipoFormulario, setTipoFormulario] = useState<'fisico' | 'juridico'>('fisico');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados separados para los archivos
  const [archivosFisico, setArchivosFisico] = useState<{
    Certificacion_Literal?: File;
    Planos_Terreno?: File;
  }>({});

  const [archivosJuridico, setArchivosJuridico] = useState<{
    Certificacion_Literal?: File;
    Planos_Terreno?: File;
  }>({});;

  // Hooks para las operaciones
  const { createAfiliadoFisico } = useAfiliadosFisicos();
  const { createAfiliadoJuridico } = useAfiliadosJuridicos();

  //  VALIDACIÓN SIMPLE SIN ZOD (ya que los DTOs no incluyen archivos)
  const validarFormularioFisico = (value: any) => {
    const errores: Record<string, string> = {};

    // Validar campos requeridos
    if (!value.Nombre?.trim()) errores.Nombre = "El nombre es requerido";
    if (!value.Apellido1?.trim()) errores.Apellido1 = "El primer apellido es requerido";
    if (!value.Cedula?.trim()) errores.Cedula = "La cédula es requerida";
    if (!value.Correo?.trim()) errores.Correo = "El correo es requerido";
    if (!value.Numero_Telefono?.trim()) errores.Numero_Telefono = "El teléfono es requerido";
    if (!value.Direccion_Exacta?.trim()) errores.Direccion_Exacta = "La dirección es requerida";
    if (!value.Edad || value.Edad < 18 || value.Edad > 120) errores.Edad = "La edad debe estar entre 18 y 120 años";

    // Validar archivos
    if (!archivosFisico.Certificacion_Literal || !(archivosFisico.Certificacion_Literal instanceof File)) {
      errores.Certificacion_Literal = "Debe subir la certificación literal del terreno";
    }
    if (!archivosFisico.Planos_Terreno || !(archivosFisico.Planos_Terreno instanceof File)) {
      errores.Planos_Terreno = "Debe subir los planos del terreno";
    }

    return errores;
  };

  const validarFormularioJuridico = (value: any) => {
    const errores: Record<string, string> = {};

    // Validar campos requeridos
    if (!value.Razon_Social?.trim()) errores.Razon_Social = "La razón social es requerida";
    if (!value.Cedula_Juridica?.trim()) errores.Cedula_Juridica = "La cédula jurídica es requerida";
    if (!value.Correo?.trim()) errores.Correo = "El correo es requerido";
    if (!value.Numero_Telefono?.trim()) errores.Numero_Telefono = "El teléfono es requerido";
    if (!value.Direccion_Exacta?.trim()) errores.Direccion_Exacta = "La dirección es requerida";

    // Validar archivos
    if (!archivosJuridico.Certificacion_Literal || !(archivosJuridico.Certificacion_Literal instanceof File)) {
      errores.Certificacion_Literal = "Debe subir la certificación literal del terreno";
    }
    if (!archivosJuridico.Planos_Terreno || !(archivosJuridico.Planos_Terreno instanceof File)) {
      errores.Planos_Terreno = "Debe subir los planos del terreno";
    }

    return errores;
  };

  // Formulario para Afiliado Físico
  const formFisico = useForm({
    defaultValues: {
      Nombre: '',
      Apellido1: '',
      Apellido2: '',
      Cedula: '',
      Correo: '',
      Direccion_Exacta: '',
      Numero_Telefono: '',
      Edad: 0,
    },

    onSubmit: async ({ value }) => {
      // DEBUGGING TEMPORAL

      setFormErrors({});

      //  VALIDAR ANTES DE ENVIAR
      const errores = validarFormularioFisico(value);
      if (Object.keys(errores).length > 0) {
        setFormErrors(errores);
        return;
      }

      console.log(" Enviando formulario físico:", value);
      console.log(" Archivos físico:", archivosFisico);

      try {
        const formData = new FormData();

        //  VERIFICAR QUE LOS VALORES NO SEAN UNDEFINED O VACÍOS ANTES DE AGREGAR
        if (value.Nombre?.trim()) {
          formData.append('Nombre', value.Nombre.trim());
        }
        if (value.Apellido1?.trim()) {
          formData.append('Apellido1', value.Apellido1.trim());
        }
        if (value.Apellido2?.trim()) {
          formData.append('Apellido2', value.Apellido2.trim());
        }
        if (value.Cedula?.trim()) {
          formData.append('Cedula', value.Cedula.trim());
        }
        if (value.Correo?.trim()) {
          formData.append('Correo', value.Correo.trim());
        }
        if (value.Numero_Telefono?.trim()) {
          formData.append('Numero_Telefono', value.Numero_Telefono.trim());
        }
        if (value.Direccion_Exacta?.trim()) {
          formData.append('Direccion_Exacta', value.Direccion_Exacta.trim());
        }
        if (value.Edad && value.Edad > 0) {
          formData.append('Edad', value.Edad.toString());
        }

        // VERIFICACIÓN CRÍTICA: SOLO AGREGAR ARCHIVOS SI SON REALMENTE ARCHIVOS
        console.log(" Verificando archivos antes de agregar:");
        console.log("Certificacion_Literal:", archivosFisico.Certificacion_Literal);
        console.log("Planos_Terreno:", archivosFisico.Planos_Terreno);
        console.log("Es Certificacion_Literal un File?", archivosFisico.Certificacion_Literal instanceof File);
        console.log("Es Planos_Terreno un File?", archivosFisico.Planos_Terreno instanceof File);

        //  SOLO AGREGAR ARCHIVOS SI SON INSTANCIAS DE FILE
        if (archivosFisico.Certificacion_Literal && archivosFisico.Certificacion_Literal instanceof File) {
          formData.append('Certificacion_Literal', archivosFisico.Certificacion_Literal);
          console.log("Certificacion_Literal agregado:", archivosFisico.Certificacion_Literal.name);
        } else {
          console.error(" Certificacion_Literal no es un archivo válido:", archivosFisico.Certificacion_Literal);
          setFormErrors({ Certificacion_Literal: "Debe seleccionar un archivo válido para la certificación" });
          return;
        }

        if (archivosFisico.Planos_Terreno && archivosFisico.Planos_Terreno instanceof File) {
          formData.append('Planos_Terreno', archivosFisico.Planos_Terreno);
          console.log("✅ Planos_Terreno agregado:", archivosFisico.Planos_Terreno.name);
        } else {
          console.error(" Planos_Terreno no es un archivo válido:", archivosFisico.Planos_Terreno);
          setFormErrors({ Planos_Terreno: "Debe seleccionar un archivo válido para los planos" });
          return;
        }

        //  DEBUG FINAL - Ver EXACTAMENTE qué contiene el FormData
        console.log(" FormData final ANTES de enviar:");
        const formDataEntries = Array.from(formData.entries());
        formDataEntries.forEach(([key, val]) => {
          if (val instanceof File) {
            console.log(`${key}: [FILE] ${val.name} (${val.size} bytes, type: ${val.type})`);
          } else {
            console.log(`${key}: ${val}`);
          }
        });

        // VERIFICACION ADICIONAL: Contar el número de entradas
        const totalEntries = formDataEntries.length;
        const fileEntries = formDataEntries.filter(([, val]) => val instanceof File).length;
        console.log(` Total entradas: ${totalEntries}, Archivos: ${fileEntries}`);

        if (fileEntries !== 2) {
          console.error(" No se encontraron exactamente 2 archivos");
          setFormErrors({ general: "Error: Faltan archivos. Asegúrese de subir ambos documentos." });
          return;
        }

        await createAfiliadoFisico(formData);
        formFisico.reset();
        setArchivosFisico({});
        setFormErrors({ general: "¡Afiliado físico creado con éxito!" });
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error(" Error al crear afiliado físico:", error);
        console.error(' Respuesta del servidor:', error.response?.data);
        setFormErrors({
          general: error.response?.data?.message || "Hubo un error al crear el afiliado físico. Intenta nuevamente."
        });
      }
    },
  });

  // Formulario para Afiliado Jurídico
  const formJuridico = useForm({
    defaultValues: {
      Razon_Social: '',
      Cedula_Juridica: '',
      Correo: '',
      Numero_Telefono: '',
      Direccion_Exacta: '',
    },

    onSubmit: async ({ value }) => {
      // DEBUGGING TEMPORAL

      setFormErrors({});

      //  VALIDAR ANTES DE ENVIAR
      const errores = validarFormularioJuridico(value);
      if (Object.keys(errores).length > 0) {
        setFormErrors(errores);
        return;
      }



      try {
        const formData = new FormData();

        // ✅ VERIFICAR QUE LOS VALORES NO SEAN UNDEFINED O VACÍOS ANTES DE AGREGAR
        if (value.Razon_Social?.trim()) {
          formData.append('Razon_Social', value.Razon_Social.trim());
        }
        if (value.Cedula_Juridica?.trim()) {
          formData.append('Cedula_Juridica', value.Cedula_Juridica.trim());
        }
        if (value.Correo?.trim()) {
          formData.append('Correo', value.Correo.trim());
        }
        if (value.Numero_Telefono?.trim()) {
          formData.append('Numero_Telefono', value.Numero_Telefono.trim());
        }
        if (value.Direccion_Exacta?.trim()) {
          formData.append('Direccion_Exacta', value.Direccion_Exacta.trim());
        }

        //  VERIFICACIÓN CRÍTICA: SOLO AGREGAR ARCHIVOS SI SON REALMENTE ARCHIVOS

        if (archivosJuridico.Certificacion_Literal && archivosJuridico.Certificacion_Literal instanceof File) {
          formData.append('Certificacion_Literal', archivosJuridico.Certificacion_Literal);
          console.log(" Certificacion_Literal agregado:", archivosJuridico.Certificacion_Literal.name);
        } else {
          console.error(" Certificacion_Literal no es un archivo válido:", archivosJuridico.Certificacion_Literal);
          setFormErrors({ Certificacion_Literal: "Debe seleccionar un archivo válido para la certificación" });
          return;
        }

        if (archivosJuridico.Planos_Terreno && archivosJuridico.Planos_Terreno instanceof File) {
          formData.append('Planos_Terreno', archivosJuridico.Planos_Terreno);
          console.log(" Planos_Terreno agregado:", archivosJuridico.Planos_Terreno.name);
        } else {
          console.error(" Planos_Terreno no es un archivo válido:", archivosJuridico.Planos_Terreno);
          setFormErrors({ Planos_Terreno: "Debe seleccionar un archivo válido para los planos" });
          return;
        }

        //  DEBUG FINAL
        console.log(" FormData final para jurídico:");
        const formDataEntries = Array.from(formData.entries());
        formDataEntries.forEach(([key, val]) => {
          if (val instanceof File) {
            console.log(`${key}: [FILE] ${val.name} (${val.size} bytes, type: ${val.type})`);
          } else {
            console.log(`${key}: ${val}`);
          }
        });

        await createAfiliadoJuridico(formData);
        formJuridico.reset();
        setArchivosJuridico({});
        setFormErrors({ general: "¡Afiliado jurídico creado con éxito!" });
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error(" Error al crear afiliado jurídico:", error);
        console.error(' Respuesta del servidor:', error.response?.data);
        setFormErrors({
          general: error.response?.data?.message || "Hubo un error al crear el afiliado jurídico. Intenta nuevamente."
        });
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-blue-50">
          <h2 className="text-2xl font-bold text-sky-800">
            Nuevo Afiliado
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (tipoFormulario === 'fisico') {
              formFisico.handleSubmit();
            } else {
              formJuridico.handleSubmit();
            }
          }}
          className="p-6"
        >
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Persona
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTipoFormulario('fisico')}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all duration-200 ${tipoFormulario === 'fisico'
                  ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-sky-300'
                  }`}
              >
                <User size={24} />
                <span className="font-medium">Persona Física</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoFormulario('juridico')}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all duration-200 ${tipoFormulario === 'juridico'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300'
                  }`}
              >
                <Building2 size={24} />
                <span className="font-medium">Persona Jurídica</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {tipoFormulario === 'fisico' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-sky-800 border-b pb-2">
                  Información Personal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <formFisico.Field name="Nombre">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="Ingrese el nombre"
                        />
                        {formErrors.Nombre && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Nombre}</span>
                        )}
                      </div>
                    )}
                  </formFisico.Field>

                  <formFisico.Field name="Apellido1">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primer Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="Primer apellido"
                        />
                        {formErrors.Apellido1 && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Apellido1}</span>
                        )}
                      </div>
                    )}
                  </formFisico.Field>

                  <formFisico.Field name="Apellido2">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Segundo Apellido
                        </label>
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="Segundo apellido"
                        />
                        {formErrors.Apellido2 && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Apellido2}</span>
                        )}
                      </div>
                    )}
                  </formFisico.Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <formFisico.Field name="Cedula">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cédula *
                        </label>
                        <input
                          type="text"
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="Número de cédula"
                        />
                        {formErrors.Cedula && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Cedula}</span>
                        )}
                      </div>
                    )}
                  </formFisico.Field>

                  <formFisico.Field name="Edad">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Edad *
                        </label>
                        <input
                          type="number"
                          required
                          min="18"
                          max="120"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="Edad"
                        />
                        {formErrors.Edad && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Edad}</span>
                        )}
                      </div>
                    )}
                  </formFisico.Field>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-purple-800 border-b pb-2">
                  Información de la Empresa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <formJuridico.Field name="Razon_Social">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Razón Social *
                        </label>
                        <input
                          type="text"
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nombre de la empresa"
                        />
                        {formErrors.Razon_Social && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Razon_Social}</span>
                        )}
                      </div>
                    )}
                  </formJuridico.Field>

                  <formJuridico.Field name="Cedula_Juridica">
                    {(field) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cédula Jurídica *
                        </label>
                        <input
                          type="text"
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="3-XXX-XXXXXX"
                        />
                        {formErrors.Cedula_Juridica && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Cedula_Juridica}</span>
                        )}
                      </div>
                    )}
                  </formJuridico.Field>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h3 className={`text-lg font-semibold border-b pb-2 ${tipoFormulario === 'fisico' ? 'text-sky-800' : 'text-purple-800'
                }`}>
                Información de Contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  {tipoFormulario === 'fisico' ? (
                    <formFisico.Field name="Numero_Telefono">
                      {(field) => (
                        <div>
                          <input
                            type="tel"
                            required
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            placeholder="Número de teléfono"
                          />
                          {formErrors.Numero_Telefono && (
                            <span className="text-red-500 text-sm block mt-1">{formErrors.Numero_Telefono}</span>
                          )}
                        </div>
                      )}
                    </formFisico.Field>
                  ) : (
                    <formJuridico.Field name="Numero_Telefono">
                      {(field) => (
                        <div>
                          <input
                            type="tel"
                            required
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Número de teléfono"
                          />
                          {formErrors.Numero_Telefono && (
                            <span className="text-red-500 text-sm block mt-1">{formErrors.Numero_Telefono}</span>
                          )}
                        </div>
                      )}
                    </formJuridico.Field>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  {tipoFormulario === 'fisico' ? (
                    <formFisico.Field name="Correo">
                      {(field) => (
                        <div>
                          <input
                            type="email"
                            required
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            placeholder="correo@ejemplo.com"
                          />
                          {formErrors.Correo && (
                            <span className="text-red-500 text-sm block mt-1">{formErrors.Correo}</span>
                          )}
                        </div>
                      )}
                    </formFisico.Field>
                  ) : (
                    <formJuridico.Field name="Correo">
                      {(field) => (
                        <div>
                          <input
                            type="email"
                            required
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="correo@ejemplo.com"
                          />
                          {formErrors.Correo && (
                            <span className="text-red-500 text-sm block mt-1">{formErrors.Correo}</span>
                          )}
                        </div>
                      )}
                    </formJuridico.Field>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección Exacta *
                </label>
                {tipoFormulario === 'fisico' ? (
                  <formFisico.Field name="Direccion_Exacta">
                    {(field) => (
                      <div>
                        <textarea
                          rows={3}
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                          placeholder="Dirección completa..."
                        />
                        {formErrors.Direccion_Exacta && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Direccion_Exacta}</span>
                        )}
                      </div>
                    )}
                  </formFisico.Field>
                ) : (
                  <formJuridico.Field name="Direccion_Exacta">
                    {(field) => (
                      <div>
                        <textarea
                          rows={3}
                          required
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Dirección completa..."
                        />
                        {formErrors.Direccion_Exacta && (
                          <span className="text-red-500 text-sm block mt-1">{formErrors.Direccion_Exacta}</span>
                        )}
                      </div>
                    )}
                  </formJuridico.Field>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className={`text-lg font-semibold border-b pb-2 ${tipoFormulario === 'fisico' ? 'text-sky-800' : 'text-purple-800'
                }`}>
                Documentos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificación Literal *
                  </label>
                  {tipoFormulario === 'fisico' ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.heic"
                        disabled={!!archivosFisico.Certificacion_Literal}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log(" Archivo Certificación seleccionado (físico):", file);
                          if (file) {
                            setArchivosFisico(prev => ({
                              ...prev,
                              Certificacion_Literal: file
                            }));
                            setFormErrors(prev => ({
                              ...prev,
                              Certificacion_Literal: ""
                            }));
                          }
                        }}
                        className="hidden"
                        id="escritura_fisico"
                      />
                      <label
                        htmlFor="certificacion_fisico"
                        className={`inline-block text-white bg-sky-600 px-3 py-2 rounded text-sm transition-colors ${archivosFisico.Certificacion_Literal ? 'cursor-not-allowed opacity-50' : 'hover:bg-sky-700 cursor-pointer'
                          }`}
                      >
                        {archivosFisico.Certificacion_Literal ? 'Archivo cargado' : 'Subir archivo'}
                      </label>
                      {archivosFisico.Certificacion_Literal && (
                        <div className="border rounded-md p-3 bg-gray-50 mt-2 flex justify-between items-center">
                          <span className="text-sm">{archivosFisico.Certificacion_Literal.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setArchivosFisico(prev => ({
                                ...prev,
                                Certificacion_Literal: undefined
                              }));
                              const input = document.getElementById("certificacion_fisico") as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                      {formErrors.Certificacion_Literal && (
                        <span className="text-red-500 text-sm block mt-1">{formErrors.Certificacion_Literal}</span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.heic"
                        disabled={!!archivosJuridico.Certificacion_Literal}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log(" Archivo Certificación seleccionado (jurídico):", file);
                          if (file) {
                            setArchivosJuridico(prev => ({
                              ...prev,
                              Certificacion_Literal: file
                            }));
                            setFormErrors(prev => ({
                              ...prev,
                              Certificacion_Literal: ""
                            }));
                          }
                        }}
                        className="hidden"
                        id="escritura_juridico"
                      />
                      <label
                        htmlFor="certificacion_juridico"
                        className={`inline-block text-white bg-purple-600 px-3 py-2 rounded text-sm transition-colors ${archivosJuridico.Certificacion_Literal ? 'cursor-not-allowed opacity-50' : 'hover:bg-purple-700 cursor-pointer'
                          }`}
                      >
                        {archivosJuridico.Certificacion_Literal ? 'Archivo cargado' : 'Subir archivo'}
                      </label>
                      {archivosJuridico.Certificacion_Literal && (
                        <div className="border rounded-md p-3 bg-gray-50 mt-2 flex justify-between items-center">
                          <span className="text-sm">{archivosJuridico.Certificacion_Literal.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setArchivosJuridico(prev => ({
                                ...prev,
                                Certificacion_Literal: undefined
                              }));
                              const input = document.getElementById("certificacion_juridico") as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                      {formErrors.Certificacion_Literal && (
                        <span className="text-red-500 text-sm block mt-1">{formErrors.Certificacion_Literal}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planos del Terreno *
                  </label>
                  {tipoFormulario === 'fisico' ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.heic"
                        disabled={!!archivosFisico.Planos_Terreno}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log(" Archivo Planos seleccionado (físico):", file);
                          if (file) {
                            setArchivosFisico(prev => ({
                              ...prev,
                              Planos_Terreno: file
                            }));
                            setFormErrors(prev => ({
                              ...prev,
                              Planos_Terreno: ""
                            }));
                          }
                        }}
                        className="hidden"
                        id="planos_fisico"
                      />
                      <label
                        htmlFor="planos_fisico"
                        className={`inline-block text-white bg-sky-600 px-3 py-2 rounded text-sm transition-colors ${archivosFisico.Planos_Terreno ? 'cursor-not-allowed opacity-50' : 'hover:bg-sky-700 cursor-pointer'
                          }`}
                      >
                        {archivosFisico.Planos_Terreno ? 'Archivo cargado' : 'Subir archivo'}
                      </label>
                      {archivosFisico.Planos_Terreno && (
                        <div className="border rounded-md p-3 bg-gray-50 mt-2 flex justify-between items-center">
                          <span className="text-sm">{archivosFisico.Planos_Terreno.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setArchivosFisico(prev => ({
                                ...prev,
                                Planos_Terreno: undefined
                              }));
                              const input = document.getElementById("planos_fisico") as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                      {formErrors.Planos_Terreno && (
                        <span className="text-red-500 text-sm block mt-1">{formErrors.Planos_Terreno}</span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.heic"
                        disabled={!!archivosJuridico.Planos_Terreno}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log("Archivo Planos seleccionado (jurídico):", file);
                          if (file) {
                            setArchivosJuridico(prev => ({
                              ...prev,
                              Planos_Terreno: file
                            }));
                            setFormErrors(prev => ({
                              ...prev,
                              Planos_Terreno: ""
                            }));
                          }
                        }}
                        className="hidden"
                        id="planos_juridico"
                      />
                      <label
                        htmlFor="planos_juridico"
                        className={`inline-block text-white bg-purple-600 px-3 py-2 rounded text-sm transition-colors ${archivosJuridico.Planos_Terreno ? 'cursor-not-allowed opacity-50' : 'hover:bg-purple-700 cursor-pointer'
                          }`}
                      >
                        {archivosJuridico.Planos_Terreno ? 'Archivo cargado' : 'Subir archivo'}
                      </label>
                      {archivosJuridico.Planos_Terreno && (
                        <div className="border rounded-md p-3 bg-gray-50 mt-2 flex justify-between items-center">
                          <span className="text-sm">{archivosJuridico.Planos_Terreno.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setArchivosJuridico(prev => ({
                                ...prev,
                                Planos_Terreno: undefined
                              }));
                              const input = document.getElementById("planos_juridico") as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                      {formErrors.Planos_Terreno && (
                        <span className="text-red-500 text-sm block mt-1">{formErrors.Planos_Terreno}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div> {/* Espacio para más secciones si es necesario */}
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={tipoFormulario === 'fisico' ? formFisico.state.isSubmitting : formJuridico.state.isSubmitting}
              className={`px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${tipoFormulario === 'fisico'
                ? 'bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-200'
                : 'bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200'
                }`}
            >
              {(tipoFormulario === 'fisico' ? formFisico.state.isSubmitting : formJuridico.state.isSubmitting) ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando...
                </span>
              ) : (
                `Crear ${tipoFormulario === 'fisico' ? 'Afiliado Físico' : 'Afiliado Jurídico'}`
              )}
            </button>
          </div>

          {formErrors.general && (
            <div className={`mt-4 p-4 rounded-lg ${formErrors.general.includes('éxito') || formErrors.general.includes('exitosamente')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
              {formErrors.general}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}