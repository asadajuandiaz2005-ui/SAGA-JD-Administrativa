import { Info, RefreshCcw, User, X, Gauge } from "lucide-react";
import type { Lectura } from "../model/Lectura";

interface DetailLecturaModalProps {
  lectura: Lectura;
  onClose: () => void;
}

export default function DetailLecturaModal({ lectura, onClose }: DetailLecturaModalProps) {
  const afiliado = lectura.Afiliado;
  let afiliadoNombre = "Sin afiliado";
  let identificacionLabel = "Identificación";
  let identificacionValor = "No disponible";

  if (afiliado) {
    if (afiliado.Tipo_Entidad === 2) {
      afiliadoNombre = afiliado.Razon_Social?.trim() || afiliado.Cedula_Juridica || `Afiliado jurídico #${afiliado.Id_Afiliado}`;
      identificacionLabel = "Cédula Jurídica";
      identificacionValor = afiliado.Cedula_Juridica || "No disponible";
    } else {
      const nombreCompleto = [afiliado.Nombre, afiliado.Primer_Apellido, afiliado.Segundo_Apellido]
        .filter(Boolean)
        .join(" ")
        .trim();

      afiliadoNombre = nombreCompleto || afiliado.Identificacion || `Afiliado #${afiliado.Id_Afiliado}`;
      identificacionValor = afiliado.Identificacion || "No disponible";
    }
  }

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 break-words [overflow-wrap:anywhere] pr-3">
              Detalle de Lectura
            </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={22} />
          </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-4 sm:p-6">
          <div className="space-y-5">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Medidor</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Número de Medidor</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {lectura.Medidor.Numero_Medidor}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Estado del Medidor</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {lectura.Medidor.Estado.Nombre_Estado}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Afiliado</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg min-w-0 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nombre completo</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {afiliadoNombre}
                  </p>
                </div>

                {afiliado && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">{identificacionLabel}</p>
                      <p className="text-sm text-gray-900 break-words [overflow-wrap:anywhere]">
                        {identificacionValor}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Correo</p>
                      <p className="text-sm text-gray-900 break-words [overflow-wrap:anywhere]">
                        {afiliado.Correo}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {lectura.Tipo_Tarifa && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Tarifa Aplicada</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tipo de Tarifa</p>
                    <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                      {lectura.Tipo_Tarifa.Nombre_Tipo_Tarifa}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <RefreshCcw className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Detalles de Consumo</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Lectura Anterior</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {lectura.Valor_Lectura_Anterior} m³
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Lectura Actual</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {lectura.Valor_Lectura_Actual} m³
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg min-w-0 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Consumo Calculado</p>
                  <p className="text-lg font-semibold text-blue-700 break-words [overflow-wrap:anywhere]">
                    {lectura.Consumo_Calculado_M3} m³
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información de Registro</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Fecha de Lectura</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {new Date(lectura.Fecha_Lectura).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg min-w-0">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Usuario</p>
                  <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                    {lectura.Usuario.Nombre_Usuario}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t bg-gray-50 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
