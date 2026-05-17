import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { useChangePassword } from "../Hooks/AuthHook";
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";

interface ChangePasswordModalProps {
    onClose: () => void;
    open: boolean;
    userId: number;
}

// Constantes para validación
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 20;

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    onClose, open, userId
}) => {
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [fieldCharCounts, setFieldCharCounts] = useState({
        currentPassword: 0,
        newPassword: 0,
        confirmPassword: 0
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingValues, setPendingValues] = useState<{
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    } | null>(null);
    const { mutateAsync } = useChangePassword();
    const { showSuccess, showError } = useAlerts();

    // Función para crear el handler de input con validación
    const createInputHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            
            // Limitar caracteres al máximo permitido
            if (value.length <= maxLength) {
                handleChange(value);
                setFieldCharCounts(prev => ({ ...prev, [fieldName]: value.length }));
                
                // Limpiar errores de validación cuando el usuario empieza a escribir
                if (formErrors[fieldName]) {
                    setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
                }
            }
        };
    };

    const form = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        onSubmit: async ({ value }) => {
            setFormErrors({});

            // Validaciones personalizadas
            const errors: Record<string, string> = {};

            if (!value.currentPassword) {
                errors.currentPassword = "La contraseña actual es requerida";
            }

            if (value.newPassword.length < PASSWORD_MIN_LENGTH) {
                errors.newPassword = `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
            }

            if (value.newPassword === value.currentPassword) {
                errors.newPassword = "La nueva contraseña debe ser diferente a la actual";
            }

            if (value.confirmPassword !== value.newPassword) {
                errors.confirmPassword = "Las contraseñas no coinciden";
            }

            if (Object.keys(errors).length > 0) {
                setFormErrors(errors);
                return;
            }

            // Guardar valores y mostrar dialog de confirmación
            setPendingValues(value);
            setShowConfirmDialog(true);
        },
    });

    // Función para ejecutar el cambio de contraseña después de confirmar
    const handleConfirmChange = async () => {
        if (!pendingValues) return;

        try {
            await mutateAsync({
                UsuarioId: userId,
                Contraseña_Actual: pendingValues.currentPassword,
                Nueva_Contraseña: pendingValues.newPassword,
            });
            showSuccess('Contraseña cambiada', 'La contraseña se ha cambiado exitosamente');
            setShowConfirmDialog(false);
            setPendingValues(null);
            onClose();
            form.reset();
        } catch (err: any) {
            // Verifica si el error es por usuario deshabilitado
            const errorMsg = err?.response?.data?.message || err?.message || '';
            if (errorMsg.includes('deshabilitado')) {
                setFormErrors({
                    general: 'No se pudo cambiar la contraseña. El usuario está deshabilitado. Contacta al administrador.',
                });
            } else {
                setFormErrors({
                    general: 'Error al cambiar la contraseña',
                });
            }
            showError(errorMsg);
            setShowConfirmDialog(false);
            setPendingValues(null);
        }
    };

    // Función para cancelar el cambio
    const handleCancelChange = () => {
        setShowConfirmDialog(false);
        setPendingValues(null);
    };

    // Función para renderizar contador de caracteres
    const renderCharCounter = (current: number, max: number, hasError: boolean, showMin = true) => {
        const remaining = max - current;
        const isNearLimit = remaining <= 5;
        
        return (
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                    {
                        (() => {
                            if (hasError) return '';
                            if (showMin) return `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`;
                            return `Máximo ${max} caracteres`;
                        })()
                    }
                </span>
                <span className={`text-xs font-medium ${
                    isNearLimit ? 'text-orange-600' : 'text-gray-500'
                }`}>
                    {current}/{max}
                    {isNearLimit && current < max && (
                        <span className="ml-1 text-orange-600">
                            ({remaining} restantes)
                        </span>
                    )}
                </span>
            </div>
        );
    };

    // Función para toggle de visibilidad de contraseña
    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    if (!open) return null;

    return (
        <div className="fixed bg-white inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Cambiar Contraseña</h2>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        {/* Contraseña Actual */}
                        <form.Field name="currentPassword">
                            {(field) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña Actual
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            value={field.state.value}
                                            onChange={createInputHandler('currentPassword', field.handleChange, PASSWORD_MAX_LENGTH)}
                                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                                (formErrors.currentPassword || field.state.meta.errors?.length) 
                                                    ? 'border-red-300 focus:ring-red-500' 
                                                    : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                            placeholder="Ingrese su contraseña actual"
                                            maxLength={PASSWORD_MAX_LENGTH}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.current ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {field.state.meta.errors?.map((err) => (
                                        <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                                    ))}
                                    {formErrors.currentPassword && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>

                        {/* Nueva Contraseña */}
                        <form.Field name="newPassword">
                            {(field) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            value={field.state.value}
                                            onChange={createInputHandler('newPassword', field.handleChange, PASSWORD_MAX_LENGTH)}
                                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                                (formErrors.newPassword || field.state.meta.errors?.length) 
                                                    ? 'border-red-300 focus:ring-red-500' 
                                                    : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                            placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
                                            maxLength={PASSWORD_MAX_LENGTH}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.new ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    
                                    {renderCharCounter(
                                        fieldCharCounts.newPassword, 
                                        PASSWORD_MAX_LENGTH, 
                                        !!(formErrors.newPassword || field.state.meta.errors?.length)
                                    )}
                                    
                                    {field.state.meta.errors?.map((err) => (
                                        <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                                    ))}
                                    {formErrors.newPassword && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>

                        {/* Confirmar Nueva Contraseña */}
                        <form.Field name="confirmPassword">
                            {(field) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            value={field.state.value}
                                            onChange={createInputHandler('confirmPassword', field.handleChange, PASSWORD_MAX_LENGTH)}
                                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                                (formErrors.confirmPassword || field.state.meta.errors?.length) 
                                                    ? 'border-red-300 focus:ring-red-500' 
                                                    : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                            placeholder="Repita su nueva contraseña"
                                            maxLength={PASSWORD_MAX_LENGTH}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.confirm ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    
                                    {renderCharCounter(
                                        fieldCharCounts.confirmPassword, 
                                        PASSWORD_MAX_LENGTH, 
                                        !!(formErrors.confirmPassword || field.state.meta.errors?.length),
                                        false
                                    )}
                                    

                                    {field.state.meta.errors?.map((err) => (
                                        <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                                    ))}
                                    {formErrors.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>

                        {/* Footer */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                        
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                                disabled={
                                    !form.state.values.currentPassword || 
                                    !form.state.values.newPassword || 
                                    !form.state.values.confirmPassword ||
                                    form.state.values.newPassword !== form.state.values.confirmPassword ||
                                    form.state.values.newPassword.length < PASSWORD_MIN_LENGTH
                                }
                            >
                                Cambiar Contraseña
                            </button>
                            <button
                                id="changePassword-form"
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>

                    </form>

                    {/* AlertDialog de Confirmación */}
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción cambiará tu contraseña. Asegúrate de recordar la nueva contraseña.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction onClick={handleConfirmChange}>
                                    Confirmar
                                </AlertDialogAction>
                                <AlertDialogCancel onClick={handleCancelChange}>
                                    Cancelar
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
};