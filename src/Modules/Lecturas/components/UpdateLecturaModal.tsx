import { useState, useEffect } from "react";
import { useUpdateLectura, useGetTarifas } from "../hook/HookLectura";
import { X } from "lucide-react";
import type { Lectura, UpdateLecturaDTO } from "../model/Lectura";

interface UpdateLecturaModalProps {
  lectura: Lectura;
  onClose: () => void;
}

export default function UpdateLecturaModal({ lectura, onClose }: UpdateLecturaModalProps) {
  const updateLecturaMutation = useUpdateLectura();
  const { data: tarifas } = useGetTarifas();

  const [formData, setFormData] = useState<UpdateLecturaDTO>({
    Id_Tipo_Tarifa: lectura.Tipo_Tarifa?.Id_Tarifa_Lectura ?? 1,
    Valor_Lectura: lectura.Valor_Lectura_Actual,
    Numero_Medidor: lectura.Medidor.Numero_Medidor,
  });

  const [errors, setErrors] = useState({
    lecturaActual: "",
  });

  useEffect(() => {
    setFormData({
      Id_Tipo_Tarifa: lectura.Tipo_Tarifa?.Id_Tarifa_Lectura ?? 1,
      Valor_Lectura: lectura.Valor_Lectura_Actual,
      Numero_Medidor: lectura.Medidor.Numero_Medidor,
    });
    setErrors({ lecturaActual: "" });
  }, [lectura]);

  const handleLecturaActualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const value = rawValue === "" ? 0 : Number.parseFloat(rawValue);
    setFormData({ ...formData, Valor_Lectura: value });

    if (rawValue === "" || Number.isNaN(value) || value < 0) {
      setErrors({ ...errors, lecturaActual: "Debe ingresar un valor válido mayor o igual a 0" });
    } else if (value < lectura.Valor_Lectura_Anterior) {
      setErrors({
        ...errors,
        lecturaActual: `La lectura actual no puede ser menor a la anterior (${lectura.Valor_Lectura_Anterior} m³)`,
      });
    } else {
      setErrors({ ...errors, lecturaActual: "" });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones finales
    if (
      formData.Valor_Lectura < lectura.Valor_Lectura_Anterior ||
      Number.isNaN(formData.Valor_Lectura) ||
      errors.lecturaActual
    ) {
      return;
    }

    await updateLecturaMutation.mutateAsync({
      idLectura: lectura.Id_Lectura,
      lectura: formData,
    });

    onClose();
  };

  const consumoCalculado = formData.Valor_Lectura - lectura.Valor_Lectura_Anterior;
  const afiliado = lectura.Afiliado;
  let afiliadoNombre = "Sin afiliado";

  if (afiliado) {
    if (afiliado.Tipo_Entidad === 2) {
      afiliadoNombre = afiliado.Razon_Social?.trim() || afiliado.Cedula_Juridica || `Afiliado jurídico #${afiliado.Id_Afiliado}`;
    } else {
      const nombreCompleto = [afiliado.Nombre, afiliado.Primer_Apellido, afiliado.Segundo_Apellido]
        .filter(Boolean)
        .join(" ")
        .trim();

      afiliadoNombre = nombreCompleto || afiliado.Identificacion || `Afiliado #${afiliado.Id_Afiliado}`;
    }
  }

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words [overflow-wrap:anywhere] pr-3">
            Editar Lectura
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          <form id="update-lectura-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-900">Información del Medidor</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Número de Medidor</p>
                  <p className="font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {lectura.Medidor.Numero_Medidor}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Afiliado</p>
                  <p className="font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {afiliadoNombre}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Lectura Anterior</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-800 break-words [overflow-wrap:anywhere]">
                  {lectura.Valor_Lectura_Anterior}
                </span>
                <span className="text-base text-gray-600">m³</span>
              </div>
            </div>

            <div>
              <label htmlFor="tarifa" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Tarifa <span className="text-red-500">*</span>
              </label>
              <select
                id="tarifa"
                value={formData.Id_Tipo_Tarifa}
                onChange={(e) =>
                  setFormData({ ...formData, Id_Tipo_Tarifa: Number.parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              >
                {tarifas?.map((tarifa) => (
                  <option key={tarifa.Id_Tarifa_Lectura} value={tarifa.Id_Tarifa_Lectura}>
                    {tarifa.Nombre_Tipo_Tarifa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lecturaActual" className="block text-sm font-medium text-gray-700 mb-1">
                Lectura Actual (m³) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="lecturaActual"
                value={Number.isNaN(formData.Valor_Lectura) ? "" : formData.Valor_Lectura}
                onChange={handleLecturaActualChange}
                step="0.01"
                min={lectura.Valor_Lectura_Anterior}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.lecturaActual ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                required
              />
              {errors.lecturaActual && (
                <p className="mt-1 text-sm text-red-500 break-words [overflow-wrap:anywhere]">{errors.lecturaActual}</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90 mb-1">Consumo Calculado</p>
              <div className="flex items-end gap-2 min-w-0">
                <span className="text-3xl sm:text-4xl font-bold break-words [overflow-wrap:anywhere]">
                  {consumoCalculado >= 0 && Number.isFinite(consumoCalculado)
                    ? consumoCalculado.toFixed(2)
                    : "0.00"}
                </span>
                <span className="text-lg sm:text-xl">m³</span>
              </div>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t bg-gray-50 z-10">
          
          <button
            type="submit"
            form="update-lectura-form"
            disabled={
              updateLecturaMutation.isPending ||
              !!errors.lecturaActual ||
              Number.isNaN(formData.Valor_Lectura) ||
              formData.Valor_Lectura < lectura.Valor_Lectura_Anterior
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {updateLecturaMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
