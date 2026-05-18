import { FileText, User, Gauge, Calendar, X, Receipt } from "lucide-react";
import type { Factura } from "../model/Factura";
import { getEstadoFacturaBadgeClass } from "../utils/estadoFacturaBadge";

interface DetailFacturaModalProps {
  factura: Factura;
  onClose: () => void;
}

const formatDate = (value: string | undefined): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function DetailFacturaModal({ factura, onClose }: DetailFacturaModalProps) {
  const af = factura.Afiliado;
  let nombreAfiliado = "Sin afiliado";
  let identLabel = "Identificación";
  let identValor = "—";

  if (af) {
    if (af.Razon_Social || af.Cedula_Juridica) {
      nombreAfiliado = af.Razon_Social?.trim() || `Afiliado #${af.Id_Afiliado}`;
      identLabel = "Cédula Jurídica";
      identValor = af.Cedula_Juridica || "—";
    } else {
      nombreAfiliado = af.Nombre_Completo?.trim() || `Afiliado #${af.Id_Afiliado}`;
      identValor = af.Identificacion || "—";
    }
  }

  const estado = factura.Estado?.Nombre_Estado ?? "—";

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Factura {factura.Numero_Factura}
                </h2>
                <div className="mt-1">
                  <span className={getEstadoFacturaBadgeClass(estado)}>
                    {estado}
                  </span>
                </div>
              </div>
            </div>
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
                  <User className="size-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Afiliado</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Nombre / Razón Social
                  </p>
                  <p className="text-sm font-medium text-gray-900">{nombreAfiliado}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    {identLabel}
                  </p>
                  <p className="text-sm text-gray-900">{identValor}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    ID Afiliado
                  </p>
                  <p className="text-sm text-gray-900">{af?.Id_Afiliado ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Gauge className="size-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Lectura asociada</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Medidor</p>
                  <p className="text-sm font-medium text-gray-900">
                    {factura.Lectura?.Numero_Medidor ?? "—"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Fecha de Lectura
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(factura.Lectura?.Fecha_Lectura)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Consumo</p>
                  <p className="text-lg font-semibold text-blue-700">{factura.Consumo_M3} m³</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Lect. Anterior
                  </p>
                  <p className="text-sm text-gray-900">
                    {factura.Lectura?.Valor_Lectura_Anterior ?? "—"} m³
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Lect. Actual
                  </p>
                  <p className="text-sm text-gray-900">
                    {factura.Lectura?.Valor_Lectura_Actual ?? "—"} m³
                  </p>
                </div>
                {factura.Tipo_Tarifa_Aplicada && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tarifa</p>
                    <p className="text-sm text-gray-900">{factura.Tipo_Tarifa_Aplicada}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Desglose</h3>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-1 text-sm">
                <div className="flex justify-between border-b border-gray-100 py-2.5">
                  <span className="text-gray-600">Cargo fijo</span>
                  <span className="font-medium text-gray-900">{factura.Cargo_Fijo}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2.5">
                  <span className="text-gray-600">Cargo consumo</span>
                  <span className="font-medium text-gray-900">{factura.Cargo_Consumo}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2.5">
                  <span className="text-gray-600">Recurso hídrico</span>
                  <span className="font-medium text-gray-900">{factura.Cargo_Recurso_Hidrico}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2.5">
                  <span className="text-gray-600">Hidrantes</span>
                  <span className="font-medium text-gray-900">{factura.Otros_Cargos}</span>
                </div>
                <div className="flex justify-between border-b-2 border-gray-200 py-2.5">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">{factura.Subtotal}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2.5">
                  <span className="text-gray-600">IVA (13%)</span>
                  <span className="font-medium text-gray-900">{factura.Impuestos}</span>
                </div>
                <div className="flex justify-between bg-blue-600 text-white px-4 py-3 rounded-lg mt-3">
                  <span className="font-semibold">Total a pagar</span>
                  <span className="text-lg font-bold">{factura.Total}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Fechas</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Fecha de Emisión
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(factura.Fecha_Emision)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Fecha de Vencimiento
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(factura.Fecha_Vencimiento)}
                  </p>
                </div>
              </div>
            </div>

            {factura.Estado?.Nombre_Estado === "Anulada" && (factura.Fecha_Anulacion || factura.Motivo_Anulacion) && (
              <div className="bg-white rounded-lg border border-red-200 overflow-hidden shadow-sm">
                <div className="bg-red-50 px-5 py-3 border-b border-red-200">
                  <h3 className="text-base font-semibold text-red-900">Información de Anulación</h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {factura.Fecha_Anulacion && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                        Fecha de Anulación
                      </p>
                      <p className="text-sm font-medium text-red-900">
                        {formatDate(factura.Fecha_Anulacion)}
                      </p>
                    </div>
                  )}
                  {factura.Motivo_Anulacion && (
                    <div className="bg-red-50 p-4 rounded-lg md:col-span-2">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Motivo</p>
                      <p className="text-sm text-red-900 whitespace-pre-wrap break-words">
                        {factura.Motivo_Anulacion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {factura.Observaciones && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">Observaciones</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {factura.Observaciones}
                  </p>
                </div>
              </div>
            )}
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
