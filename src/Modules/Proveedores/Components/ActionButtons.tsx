import React, { useState } from 'react';
import { useChangeProveedorFisicoStatus } from '../Hook/hookFisicoProveedor';
import { useChangeProveedorJuridicoStatus } from '../Hook/hookjuridicoproveedor';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogHeader,
    AlertDialogFooter
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import type { ProveedorFisico } from '../Models/TablaProveedo/tablaFisicoProveedor';
import type { ProveedorJuridico } from '../Models/TablaProveedo/tablaJuridicoProveedor';
import EditProveedorModal from './EditFisicoProveedoresModal';
import EditProveedorJuridicoModal from './EditJuridicoProveedorModal';
import ProveedorDetailModal from './DetailFisicoProveedor';
import ProveedorJuridicoDetailModal from './DetailJuridicoProveedor';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';

interface ActionButtonsProps {
    proveedor: ProveedorFisico | ProveedorJuridico;
    tipoProveedor: 'Físico' | 'Jurídico';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ proveedor, tipoProveedor }) => {
    // Hooks para cambiar estado de proveedores
    const { changeStatus: changeStatusFisico, isChangingStatus: isChangingStatusFisico } = useChangeProveedorFisicoStatus();
    const { changeStatus: changeStatusJuridico, isChangingStatus: isChangingStatusJuridico } = useChangeProveedorJuridicoStatus();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const { showSuccess, showError } = useAlerts();
    const { canEdit, canView } = useUserPermissions();

    const hasEditPermission = canEdit('proveedores');
    const hasViewPermission = canView('proveedores');

    // Determinar estado activo del proveedor
    const isActiveProveedor = (estado: any): boolean => {
        if (!estado) return false;
        const estadoNombre = estado.Estado_Proveedor?.toLowerCase() || '';
        return estadoNombre === 'activo';
    };



    // Manejar cambio de estado
    const handleChangeStatus = async (newStatus: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir propagación del evento

        if (!proveedor.Id_Proveedor) {
            showError('Error: No se puede cambiar el estado, ID del proveedor no encontrado');
            return;
        }

        try {
            if (tipoProveedor === 'Físico') {
                await changeStatusFisico({ id: proveedor.Id_Proveedor, nuevoEstado: newStatus });
            } else {
                await changeStatusJuridico({ id: proveedor.Id_Proveedor, nuevoEstado: newStatus });
            }
            
            const statusText = newStatus === 1 ? 'activado' : 'desactivado';
            const tipoText = tipoProveedor === 'Físico' ? 'físico' : 'jurídico';
            showSuccess(`¡Proveedor ${tipoText} ${statusText} exitosamente!`);
        } catch (error) {
            console.error('Error al cambiar estado del proveedor:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cambiar el estado del proveedor';
            showError(`Error al cambiar el estado del proveedor: ${errorMessage}`);
        }
    };

    const handleActivate = (e: React.MouseEvent) => handleChangeStatus(1, e);
    const handleDeactivate = (e: React.MouseEvent) => handleChangeStatus(2, e);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir propagación del evento
        setShowEditModal(true);
    };

    const isChangingStatus = tipoProveedor === 'Físico' ? isChangingStatusFisico : isChangingStatusJuridico;

    return (
        <div className="flex items-center justify-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Botón de Ver */}
            {hasViewPermission && (
                <button
                    type="button"
                    onClick={() => setShowDetailModal(true)}
                    className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                    title="Ver proveedor"
                >
                    Ver
                </button>
            )}

            {/* Botón de Editar */}
            {hasEditPermission && (
                <button
                    type="button"
                    onClick={handleEdit}
                    className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                    title="Editar proveedor"
                >
                    Editar
                </button>
            )}

            {/* Botón de Cambiar Estado */}
            {hasEditPermission && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className={`px-1 sm:px-4 py-0.5 sm:py-1.5 text-[7px] sm:text-xs rounded transition-colors whitespace-nowrap ${
                            isActiveProveedor(proveedor.Estado_Proveedor)
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title="Cambiar estado"
                        disabled={isChangingStatus}
                    >
                        {isActiveProveedor(proveedor.Estado_Proveedor) ? 'Desactivar' : 'Activar'}
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Cambiar estado del proveedor?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isActiveProveedor(proveedor.Estado_Proveedor)
                                ? '¿Estás seguro de que deseas desactivar este proveedor? Podrás reactivarlo más tarde si es necesario.'
                                : '¿Estás seguro de que deseas activar este proveedor?'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={isActiveProveedor(proveedor.Estado_Proveedor) ? handleDeactivate : handleActivate}
                            disabled={isChangingStatus}
                        >
                            {isChangingStatus
                                ? (isActiveProveedor(proveedor.Estado_Proveedor) ? 'Desactivando...' : 'Activando...')
                                : (isActiveProveedor(proveedor.Estado_Proveedor) ? 'Desactivar' : 'Activar')
                            }
                        </AlertDialogAction>
                        <AlertDialogCancel>
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            )}

            {/* Modales de Edición */}
            {tipoProveedor === 'Físico' ? (
                <EditProveedorModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    proveedor={proveedor as ProveedorFisico}
                />
            ) : (
                <EditProveedorJuridicoModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    proveedor={proveedor as ProveedorJuridico}
                />
            )}

            {/* Modales de Detalle */}
            {tipoProveedor === 'Físico' ? (
                <ProveedorDetailModal
                    proveedor={proveedor as ProveedorFisico}
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                />
            ) : (
                <ProveedorJuridicoDetailModal
                    proveedor={proveedor as ProveedorJuridico}
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                />
            )}
        </div>
    );
};

export default ActionButtons;