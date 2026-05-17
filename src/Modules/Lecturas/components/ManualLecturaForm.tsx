import { useState } from "react";
import type { CreateLecturaDTO, TipoTarifaLectura } from "../model/Lectura";

interface ManualLecturaFormProps {
  onSubmit: (data: CreateLecturaDTO) => Promise<void>;
  onCancel: () => void;
  tarifas?: TipoTarifaLectura[];
  isSubmitting: boolean;
}

export default function ManualLecturaForm({ 
  onSubmit, 
  onCancel, 
  tarifas, 
  isSubmitting 
}: ManualLecturaFormProps) {
  const [formData, setFormData] = useState<CreateLecturaDTO>({
    Numero_Medidor: 0,
    Id_Tipo_Tarifa: 1,
    Valor_Lectura: 0,
  });

  const [errors, setErrors] = useState({
    medidor: "",
    lecturaActual: "",
  });

  const handleMedidorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setFormData({ ...formData, Numero_Medidor: value });

    if (isNaN(value) || value <= 0) {
      setErrors({ ...errors, medidor: "Debe ingresar un número de medidor válido" });
    } else {
      setErrors({ ...errors, medidor: "" });
    }
  };

  const handleLecturaActualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFormData({ ...formData, Valor_Lectura: value });

    if (isNaN(value) || value < 0) {
      setErrors({ 
        ...errors, 
        lecturaActual: "Debe ingresar un valor válido mayor o igual a 0" 
      });
    } else {
      setErrors({ ...errors, lecturaActual: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones finales
    if (
      formData.Numero_Medidor <= 0 ||
      formData.Valor_Lectura < 0 ||
      Object.values(errors).some((error) => error !== "")
    ) {
      return;
    }

    await onSubmit(formData);
  };

  const isFormValid = 
    formData.Numero_Medidor > 0 &&
    formData.Valor_Lectura >= 0 &&
    Object.values(errors).every((error) => error === "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Número Medidor */}
      <div>
        <label htmlFor="medidor" className="block text-sm font-medium text-gray-700 mb-1">
          Número del Medidor <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="medidor"
          value={formData.Numero_Medidor || ""}
          onChange={handleMedidorChange}
          inputMode="numeric"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.medidor ? "border-red-300 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Ingrese el número del medidor"
          required
        />
        {errors.medidor && (
          <p className="mt-1 text-sm text-red-500 break-words [overflow-wrap:anywhere]">
            {errors.medidor}
          </p>
        )}
      </div>

      {/* Tipo de Tarifa */}
      <div>
        <label htmlFor="tarifa" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Tarifa <span className="text-red-500">*</span>
        </label>
        <select
          id="tarifa"
          value={formData.Id_Tipo_Tarifa}
          onChange={(e) =>
            setFormData({
              ...formData,
              Id_Tipo_Tarifa: Number.parseInt(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          required
        >
          {tarifas?.map((tarifa) => (
            <option
              key={tarifa.Id_Tarifa_Lectura}
              value={tarifa.Id_Tarifa_Lectura}
            >
              {tarifa.Nombre_Tipo_Tarifa}
            </option>
          ))}
        </select>
      </div>

      {/* Lectura Actual */}
      <div>
        <label
          htmlFor="lecturaActual"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Lectura Actual (m³) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="lecturaActual"
          value={formData.Valor_Lectura}
          onChange={handleLecturaActualChange}
          step="0.01"
          min="0"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.lecturaActual ? "border-red-300 bg-red-50" : "border-gray-300"
          }`}
          required
        />
        {errors.lecturaActual && (
          <p className="mt-1 text-sm text-red-500 break-words [overflow-wrap:anywhere]">
            {errors.lecturaActual}
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
        
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? "Creando..." : "Crear Lectura"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
