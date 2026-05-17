import { useMemo, useState } from 'react';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import {
    asignarMedidorExistenteAfiliado,
    crearYAsignarMedidorAfiliado,
} from '../Service/ServiceAfiliadoFisico';
import {
    asignarMedidorExistenteAfiliadoJuridico,
    crearYAsignarMedidorAfiliadoJuridico,
} from '../Service/ServiceAfiliadoJuridico';
import MedidorSelectorModal, { type MedidorPendiente } from './MedidorSelectorModal';

interface AsignarMedidorAfiliadoModalProps {
    isOpen: boolean;
    afiliadoId: number | null;
    afiliadoNombre: string;
    afiliadoTipo?: 'afiliado-fisico' | 'afiliado-juridico'; // Nuevo prop para identificar el tipo
    onClose: () => void;
    onSuccess: () => void;
}

const AsignarMedidorAfiliadoModal: React.FC<AsignarMedidorAfiliadoModalProps> = ({
    isOpen,
    afiliadoId,
    afiliadoNombre,
    afiliadoTipo = 'afiliado-fisico', // Por defecto físico para compatibilidad
    onClose,
    onSuccess,
}) => {
    const { showError, showSuccess } = useAlerts();
    const [medidoresPendientes, setMedidoresPendientes] = useState<MedidorPendiente[]>([]);
    const [medidorModalOpen, setMedidorModalOpen] = useState(false);
    const [medidorModalModo, setMedidorModalModo] = useState<'asignar' | 'agregar'>('asignar');
    const [guardando, setGuardando] = useState(false);

    const puedeGuardar = useMemo(() => medidoresPendientes.length > 0 && !guardando, [medidoresPendientes.length, guardando]);

    const limpiarEstado = () => {
        setMedidoresPendientes([]);
        setMedidorModalOpen(false);
        setMedidorModalModo('asignar');
        setGuardando(false);
    };

    const handleClose = () => {
        if (guardando) return;
        limpiarEstado();
        onClose();
    };

    const handleConfirmarMedidor = (mp: MedidorPendiente) => {
        setMedidoresPendientes((prev) => [...prev, mp]);
        setMedidorModalOpen(false);
    };

    const handleQuitarMedidor = (uid: string) => {
        setMedidoresPendientes((prev) => prev.filter((m) => m.uid !== uid));
    };

    const handleGuardarAsignaciones = async () => {
        if (!afiliadoId || medidoresPendientes.length === 0 || guardando) return;

        try {
            setGuardando(true);

            // Seleccionar las funciones correctas según el tipo de afiliado
            const esJuridico = afiliadoTipo === 'afiliado-juridico';
            const funcionAsignarExistente = esJuridico ? asignarMedidorExistenteAfiliadoJuridico : asignarMedidorExistenteAfiliado;
            const funcionCrearYAsignar = esJuridico ? crearYAsignarMedidorAfiliadoJuridico : crearYAsignarMedidorAfiliado;

            // Procesar cada medidor pendiente
            for (const medidor of medidoresPendientes) {
                if (medidor.tipo === 'asignar') {
                    await funcionAsignarExistente(
                        afiliadoId,
                        medidor.idMedidor,
                        medidor.escrituraFile,
                        medidor.planosFile,
                        medidor.estadoPago
                    );
                } else {
                    await funcionCrearYAsignar(
                        afiliadoId,
                        medidor.numeroMedidor as number,
                        medidor.escrituraFile,
                        medidor.planosFile,
                        medidor.estadoPago
                    );
                }
            }

            showSuccess('Medidor(es) asignado(s) correctamente');
            limpiarEstado();
            onSuccess();
            onClose();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'No se pudieron asignar los medidores.';
            showError('Error al asignar medidores', errorMessage);
        } finally {
            setGuardando(false);
        }
    };

    if (!isOpen || !afiliadoId) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Asignar Medidor</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Afiliado: {afiliadoNombre}</p>
                        </div>
                    </div>

                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Medidores por asignar
                                {medidoresPendientes.length > 0 && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        {medidoresPendientes.length}
                                    </span>
                                )}
                            </h3>
                        </div>

                        {medidoresPendientes.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-500">
                                No hay medidores en la lista.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {medidoresPendientes.map((mp) => (
                                    <div
                                        key={mp.uid}
                                        className="flex items-center justify-between gap-3 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">Medidor #{mp.numeroMedidor}</p>
                                            <p className="text-xs text-gray-500">
                                                {mp.tipo === 'asignar' ? 'Asignar existente' : 'Crear y asignar'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleQuitarMedidor(mp.uid)}
                                            disabled={guardando}
                                            className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMedidorModalModo('asignar');
                                    setMedidorModalOpen(true);
                                }}
                                disabled={guardando}
                                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Agregar Existente
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMedidorModalModo('agregar');
                                    setMedidorModalOpen(true);
                                }}
                                disabled={guardando}
                                className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Crear y Asignar
                            </button>
                        </div>
                    </div>

                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleGuardarAsignaciones}
                            disabled={!puedeGuardar}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {guardando ? 'Asignando...' : 'Guardar Asignaciones'}
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={guardando}
                            className="px-4 py-2 text-sm rounded-lg rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            <MedidorSelectorModal
                isOpen={medidorModalOpen}
                modo={medidorModalModo}
                onClose={() => setMedidorModalOpen(false)}
                onConfirm={handleConfirmarMedidor}
            />
        </>
    );
};

export default AsignarMedidorAfiliadoModal;
