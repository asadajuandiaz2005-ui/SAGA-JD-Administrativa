import { useState } from 'react';
import { useDeleteProveedorFisico } from '../Hook/hookFisicoProveedor';
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

interface DeleteProveedorButtonProps {
  proveedorId: number;
  proveedorNombre: string;
  onDeleteSuccess?: () => void;
}

const DeleteProveedorButton: React.FC<DeleteProveedorButtonProps> = ({ 
  proveedorId, 
  proveedorNombre,
  onDeleteSuccess 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { 
    deleteProveedorFisico, 
    isDeleting
  } = useDeleteProveedorFisico();

  const handleConfirmDelete = async () => {
    try {
      await deleteProveedorFisico(proveedorId);
      setShowDeleteDialog(false);
      
      // Callback opcional para acciones adicionales
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDeleteDialog(true)}
        disabled={isDeleting}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          isDeleting
            ? 'bg-red-300 text-red-800 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={`Eliminar proveedor ${proveedorNombre}`}
      >
        {isDeleting ? (
          <>
            <span className="animate-spin inline-block w-3 h-3 border border-red-800 border-t-transparent rounded-full mr-1"></span>
            Eliminando...
          </>
        ) : (
          '🗑️ Eliminar'
        )}
      </button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar al proveedor "{proveedorNombre}"?
              <br /><br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteProveedorButton;