import { useState } from 'react';
import {
    useAprobarYEnEspera,
    useCompletar,
    useRechazar
} from '../Hooks/HookEstadosSolicitudes';
import type { TipoSolicitud, TipoPersona } from '../Types/EstadoSolicitudes';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";

interface EstadoButtonsProps {
    solicitudId: string | number;
    estadoActual?: string;
    tipoSolicitud: TipoSolicitud;
    tipoPersona: TipoPersona;
    onEstadoChanged?: (nuevoEstado: string) => void;
}


const EstadoButtons: React.FC<EstadoButtonsProps> = ({
    solicitudId,
    estadoActual,
    tipoSolicitud,
    tipoPersona,
    onEstadoChanged
}) => {
    const [showAprobarDialog, setShowAprobarDialog] = useState(false);
    const [showCompletarDialog, setShowCompletarDialog] = useState(false);
    const [showRechazarDialog, setShowRechazarDialog] = useState(false);

    // Hooks unificados
    const aprobarMutation = useAprobarYEnEspera();
    const completarMutation = useCompletar();
    const rechazarMutation = useRechazar();

    // Handle para aprobar y poner en espera
    const handleConfirmAprobar = async () => {
        try {
            await aprobarMutation.mutateAsync(tipoSolicitud, tipoPersona, solicitudId);
            
            setShowAprobarDialog(false);
            onEstadoChanged?.('Aprobada en Espera');
        } catch (error) {
            console.error(' Error al aprobar solicitud:', error);
            setShowAprobarDialog(false);
        }
    };

    // Handle para completar solicitud
    const handleConfirmCompletar = async () => {
        try {

            await completarMutation.mutateAsync(tipoSolicitud, tipoPersona, solicitudId);
            
            setShowCompletarDialog(false);
            onEstadoChanged?.('Completada');
        } catch (error) {
            console.error(' Error al completar solicitud:', error);
            setShowCompletarDialog(false);
        }
    };

    // Handle para rechazar solicitud
    const handleConfirmRechazar = async () => {
        try {
        
            await rechazarMutation.mutateAsync(tipoSolicitud, tipoPersona, solicitudId);
            
            setShowRechazarDialog(false);
            onEstadoChanged?.('Rechazada');
        } catch (error) {
            console.error('❌ Error al rechazar solicitud:', error);
            setShowRechazarDialog(false);
        }
    };

    const isLoading = aprobarMutation.isPending || completarMutation.isPending || rechazarMutation.isPending;

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {/* Botón para aprobar y poner en espera */}
                <button
                    onClick={() => setShowAprobarDialog(true)}
                    disabled={isLoading || estadoActual === 'Aprobada en Espera' || estadoActual === 'Completada'}
                    className="px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-green-200"
                >
                    {aprobarMutation.isPending ? 'Procesando...' : '✓ Aprobar'}
                </button>

                {/* Botón para completar */}
                <button
                    onClick={() => setShowCompletarDialog(true)}
                    disabled={isLoading || estadoActual === 'Completada' || estadoActual === 'Rechazada'}
                    className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-blue-200"
                >
                    {completarMutation.isPending ? 'Procesando...' : '✓ Completar'}
                </button>

                {/* Botón para rechazar */}
                <button
                    onClick={() => setShowRechazarDialog(true)}
                    disabled={isLoading || estadoActual === 'Rechazada' || estadoActual === 'Completada'}
                    className="px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-red-200"
                >
                    {rechazarMutation.isPending ? 'Procesando...' : '✗ Rechazar'}
                </button>
            </div>

            {/* AlertDialog para Aprobar */}
            <AlertDialog open={showAprobarDialog} onOpenChange={setShowAprobarDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Aprobar solicitud?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cambiará el estado de la solicitud a "Aprobada en Espera". 
                            La solicitud quedará lista para ser completada posteriormente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction 
                            onClick={handleConfirmAprobar}
                            disabled={aprobarMutation.isPending}
                        >
                            {aprobarMutation.isPending ? 'Aprobando...' : 'Aprobar'}
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={aprobarMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para Completar */}
            <AlertDialog open={showCompletarDialog} onOpenChange={setShowCompletarDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Completar solicitud?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción marcará la solicitud como "Completada". 
                            Asegúrese de que todos los procesos relacionados han sido finalizados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction 
                            onClick={handleConfirmCompletar}
                            disabled={completarMutation.isPending}
                        >
                            {completarMutation.isPending ? 'Completando...' : 'Completar'}
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={completarMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para Rechazar */}
            <AlertDialog open={showRechazarDialog} onOpenChange={setShowRechazarDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Rechazar solicitud?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cambiará el estado de la solicitud a "Rechazada". 
                            Esta decisión puede ser definitiva según las políticas de la organización.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>

                        <AlertDialogAction 
                            onClick={handleConfirmRechazar}
                            disabled={rechazarMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={rechazarMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default EstadoButtons;