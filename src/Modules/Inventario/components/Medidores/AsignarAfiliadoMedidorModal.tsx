import { useState, useEffect, useMemo } from 'react';
import { LuX, LuSearch, LuUserCheck, LuUser, LuFileText, LuMap } from 'react-icons/lu';
import { FaTachometerAlt } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import type { AsignarAfiliadoMedidorModalProps } from '../../types/MedidorTypes';
import { asignarMedidorConArchivos } from '../../service/MedidorServices';
import { getAfiliadosFisicos } from '@/Modules/Afiliados/Service/ServiceAfiliadoFisico';
import type { AfiliadoFisico } from '@/Modules/Afiliados/Models/TablaAfiliados/ModeloAfiliadoFisico';
import { getAfiliadosJuridicos } from '@/Modules/Afiliados/Service/ServiceAfiliadoJuridico';
import type { AfiliadoJuridico } from '@/Modules/Afiliados/Models/TablaAfiliados/ModeloAfiliadoJuridico';

interface AfiliadoOpcion {
  Id_Afiliado: number;
  nombre: string;
  identificacion: string;
  correo?: string;
  tipo: 'fisico' | 'juridico';
}

const AsignarAfiliadoMedidorModal = ({
  isOpen,
  onClose,
  medidor,
  onSuccess,
}: AsignarAfiliadoMedidorModalProps) => {
  const queryClient = useQueryClient();
  const [afiliados, setAfiliados] = useState<AfiliadoOpcion[]>([]);
  const [loadingAfiliados, setLoadingAfiliados] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAfiliado, setSelectedAfiliado] = useState<AfiliadoOpcion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [escrituraFile, setEscrituraFile] = useState<File | null>(null);
  const [planosFile, setPlanosFile] = useState<File | null>(null);
  const [estadoPago, setEstadoPago] = useState<'Pagado' | 'Pendiente' | ''>('');

  useEffect(() => {
    if (!isOpen) return;
    setLoadingAfiliados(true);
    setErrorMsg(null);
    setSelectedAfiliado(null);
    setSearchTerm('');
    setSuccessMsg(null);
    setEscrituraFile(null);
    setPlanosFile(null);
    setEstadoPago('');

    Promise.all([getAfiliadosFisicos(), getAfiliadosJuridicos()])
      .then(([fisicos, juridicos]: [AfiliadoFisico[], AfiliadoJuridico[]]) => {
        const listaFisicos: AfiliadoOpcion[] = fisicos.map((a) => ({
          Id_Afiliado: a.Id_Afiliado,
          nombre: `${a.Nombre} ${a.Apellido1} ${a.Apellido2 ?? ''}`.trim(),
          identificacion: a.Identificacion,
          correo: a.Correo,
          tipo: 'fisico' as const,
        }));
        const listaJuridicos: AfiliadoOpcion[] = juridicos.map((a) => ({
          Id_Afiliado: a.Id_Afiliado,
          nombre: a.Razon_Social,
          identificacion: a.Cedula_Juridica,
          correo: a.Correo,
          tipo: 'juridico' as const,
        }));
        setAfiliados([...listaFisicos, ...listaJuridicos]);
      })
      .catch(() => setErrorMsg('Error al cargar los afiliados.'))
      .finally(() => setLoadingAfiliados(false));
  }, [isOpen]);

  const afiliadosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return afiliados;
    const term = searchTerm.toLowerCase();
    return afiliados.filter(
      (a) =>
        a.nombre.toLowerCase().includes(term) ||
        a.identificacion.toLowerCase().includes(term) ||
        (a.correo ?? '').toLowerCase().includes(term)
    );
  }, [afiliados, searchTerm]);

  const handleConfirmar = async () => {
    if (!selectedAfiliado || !escrituraFile || !planosFile || !estadoPago) return;
    setGuardando(true);
    setErrorMsg(null);
    try {
      await asignarMedidorConArchivos(
        medidor.Id_Medidor,
        selectedAfiliado.Id_Afiliado,
        escrituraFile,
        planosFile,
        estadoPago
      );
      // Invalidar caches de afiliados para que el DetailAfiliadoModal muestre los medidores actualizados
      await queryClient.invalidateQueries({ queryKey: ['afiliadosFisicos'] });
      await queryClient.invalidateQueries({ queryKey: ['afiliadosJuridicos'] });
      setSuccessMsg(
        `Medidor #${medidor.Numero_Medidor} asignado correctamente a ${selectedAfiliado.nombre}.`
      );
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ocurrió un error al asignar el medidor.';
      setErrorMsg(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FaTachometerAlt className="text-blue-600 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Asignar a Afiliado</h2>
              <p className="text-sm text-gray-500">
                Medidor <span className="font-semibold text-blue-700">#{medidor.Numero_Medidor}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            disabled={guardando}
          >
            <LuX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          

          {/* Buscar afiliado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar afiliado
            </label>
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Nombre, cédula o correo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedAfiliado(null);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de afiliados */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
            {loadingAfiliados ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                Cargando afiliados...
              </div>
            ) : afiliadosFiltrados.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No se encontraron afiliados
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {afiliadosFiltrados.map((a) => (
                  <li key={a.Id_Afiliado}>
                    <button
                      type="button"
                      onClick={() => setSelectedAfiliado(a)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                        selectedAfiliado?.Id_Afiliado === a.Id_Afiliado
                          ? 'bg-blue-100 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <LuUser className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">{a.nombre}</p>
                          <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                            a.tipo === 'juridico'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {a.tipo === 'juridico' ? 'Jurídico' : 'Físico'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{a.identificacion}</p>
                      </div>
                      {selectedAfiliado?.Id_Afiliado === a.Id_Afiliado && (
                        <LuUserCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Afiliado seleccionado */}
          {selectedAfiliado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-blue-800 flex items-center gap-1">
                <LuUserCheck className="w-4 h-4" /> Afiliado seleccionado
              </p>
              <p className="text-blue-700 mt-1 flex items-center gap-2">
                {selectedAfiliado.nombre}{' '}
                <span className="text-blue-500">({selectedAfiliado.identificacion})</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                  selectedAfiliado.tipo === 'juridico'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedAfiliado.tipo === 'juridico' ? 'Jurídico' : 'Físico'}
                </span>
              </p>
            </div>
          )}

          {/* Archivos requeridos — aparecen al seleccionar afiliado */}
          {selectedAfiliado && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Documentos del Terreno <span className="text-red-500">*</span></p>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado de Pago <span className="text-red-500">*</span></label>
                <select
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value as 'Pagado' | 'Pendiente' | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione estado de pago</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>

              {/* Certificación */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Certificación Literal</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setEscrituraFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`w-full px-3 py-2 border rounded-lg bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors ${
                    escrituraFile ? 'border-green-400' : 'border-gray-300'
                  }`}>
                    <span className="text-sm text-gray-700 truncate flex items-center gap-2">
                      <LuFileText className="w-4 h-4 text-gray-400 shrink-0" />
                      {escrituraFile ? escrituraFile.name : 'Seleccionar archivo...'}
                    </span>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded text-xs shrink-0 ml-2">Subir</span>
                  </div>
                </div>
              </div>

              {/* Planos */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Planos del Terreno</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setPlanosFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`w-full px-3 py-2 border rounded-lg bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors ${
                    planosFile ? 'border-green-400' : 'border-gray-300'
                  }`}>
                    <span className="text-sm text-gray-700 truncate flex items-center gap-2">
                      <LuMap className="w-4 h-4 text-gray-400 shrink-0" />
                      {planosFile ? planosFile.name : 'Seleccionar archivo...'}
                    </span>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded text-xs shrink-0 ml-2">Subir</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mensajes */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
         
          <button
            onClick={handleConfirmar}
            disabled={!selectedAfiliado || !escrituraFile || !planosFile || !estadoPago || guardando}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Asignando...
              </>
            ) : (
              <>
                <LuUserCheck className="w-4 h-4" />
                Confirmar Asignación
              </>
            )}
          </button>
           <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarAfiliadoMedidorModal;
