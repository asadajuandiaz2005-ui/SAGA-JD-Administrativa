import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import type { AfiliadoFisico } from '../Models/TablaAfiliados/ModeloAfiliadoFisico';
import type { AfiliadoJuridico } from '../Models/TablaAfiliados/ModeloAfiliadoJuridico';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { useAfiliadosFisicos } from '../Hook/HookAfiliadoFisico';
import { useAfiliadosJuridicos } from '../Hook/HookAfiliadoJuridico';
import { formatCedulaJuridica } from '../Helper/formatUtils';
import PhoneInputComponent from '@/Modules/Global/components/PhoneInputComponent';
import { AfiliadoFisicoEditSchema } from '../Schemas/AfiliadoFisico';
import { AfiliacionJuridicaEditSchema } from '../Schemas/AfiliadoJuridico';
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




// Tipo unificado para identificar qué estamos editando
type PersonaParaEditar = {
    tipo: 'afiliado-fisico' | 'afiliado-juridico';
    datos: AfiliadoFisico | AfiliadoJuridico;
};

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    persona: PersonaParaEditar;
}

// Constantes para límites de caracteres
const NOMBRE_MAX_LENGTH = 50;
const APELLIDO_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const DIRECCION_MAX_LENGTH = 200;

// Función de validación usando Zod schemas
const validateField = (fieldName: string, value: any, tipoPersona: 'afiliado-fisico' | 'afiliado-juridico'): string | undefined => {
    try {
        if (tipoPersona === 'afiliado-fisico') {
            const fieldSchema = AfiliadoFisicoEditSchema.shape[fieldName as keyof typeof AfiliadoFisicoEditSchema.shape];
            if (fieldSchema) {
                fieldSchema.parse(value);
            }
        } else {
            const fieldSchema = AfiliacionJuridicaEditSchema.shape[fieldName as keyof typeof AfiliacionJuridicaEditSchema.shape];
            if (fieldSchema) {
                fieldSchema.parse(value);
            }
        }
        return undefined;
    } catch (error: any) {
        if (error?.issues?.[0]?.message) {
            return error.issues[0].message;
        }
        return 'Valor inválido';
    }
};

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, persona }) => {
    const { showSuccess, showError } = useAlerts();
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const { updateAfiliadoFisico } = useAfiliadosFisicos();
    const { updateAfiliadoJuridico } = useAfiliadosJuridicos();
    const [fieldCharCounts, setFieldCharCounts] = useState({
        nombre: 0,
        apellido1: 0,
        apellido2: 0,
        razonSocial: 0,
        correo: 0,
        telefono: 0,
        cedula: 0,
        direccion: 0
    });

    const createInputHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const value = e.target.value;

            if (value.length <= maxLength) {
                handleChange(value);
                setFieldCharCounts(prev => ({ ...prev, [fieldName]: value.length }));

                // Validación en tiempo real con Zod
                const validationError = validateField(fieldName, value, persona.tipo);
                if (validationError) {
                    setFormErrors(prev => ({ ...prev, [fieldName]: validationError }));
                } else {
                    setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
                }
            }
        };
    };

    const getDefaultValues = () => {
        const { tipo, datos } = persona;

        if (tipo === 'afiliado-fisico') {
            const afiliado = datos as AfiliadoFisico;
            return {
                Nombre: afiliado.Nombre,
                Apellido1: afiliado.Apellido1,
                Apellido2: afiliado.Apellido2?.includes('No Proporcionado') ? '' : afiliado.Apellido2 || '',
                Tipo_Identificacion: (afiliado as any).Tipo_Identificacion || 'Cedula Nacional' as 'Cedula Nacional' | 'Dimex' | 'Pasaporte',
                Identificacion: afiliado.Identificacion,
                Numero_Telefono: afiliado.Numero_Telefono,
                Correo: afiliado.Correo,
                Direccion_Exacta: afiliado.Direccion_Exacta || '',
                Edad: afiliado.Edad,
                Certificacion_Literal: afiliado.Certificacion_Literal || '',
                Planos_Terreno: afiliado.Planos_Terreno || '',
            };
        } else { // afiliado-juridico
            const afiliado = datos as AfiliadoJuridico;
            return {
                Razon_Social: afiliado.Razon_Social,
                Cedula_Juridica: afiliado.Cedula_Juridica,
                Numero_Telefono: afiliado.Numero_Telefono,
                Correo: afiliado.Correo,
                Direccion_Exacta: afiliado.Direccion_Exacta || '',
                Certificacion_Literal: afiliado.Certificacion_Literal || '',
                Planos_Terreno: afiliado.Planos_Terreno || '',
            };
        }
    };

    const form = useForm({
        defaultValues: getDefaultValues(),
        onSubmit: async ({ value }) => {
            if (isSubmitting) return;

            setFormErrors({});

            try {
                setIsSubmitting(true);

                // Crear FormData para enviar archivos
                const formData = new FormData();

                if (persona.tipo === 'afiliado-fisico') {
                    const afiliadoFisico = persona.datos as AfiliadoFisico;

                    // Agregar campos editables de afiliado físico (excluir Identificacion y Tipo_Identificacion)
                    formData.append('Nombre', value.Nombre || '');
                    formData.append('Apellido1', value.Apellido1 || '');
                    formData.append('Apellido2', value.Apellido2 || '');
                    // Tipo_Identificacion no se envía en actualización
                    formData.append('Numero_Telefono', value.Numero_Telefono || '');
                    formData.append('Correo', value.Correo || '');
                    formData.append('Direccion_Exacta', value.Direccion_Exacta || '');
                    formData.append('Edad', value.Edad?.toString() || '0');

                    // Usar la identificación como cédula para la ruta
                    const cedula = afiliadoFisico.Identificacion || '';
                    await updateAfiliadoFisico({ cedula, data: formData });
                    showSuccess('¡Afiliado físico actualizado exitosamente!');
                } else {
                    const afiliadoJuridico = persona.datos as AfiliadoJuridico;

                    // Agregar campos editables de afiliado jurídico (no incluir Cedula_Juridica)
                    formData.append('Razon_Social', value.Razon_Social || '');
                    formData.append('Numero_Telefono', value.Numero_Telefono || '');
                    formData.append('Correo', value.Correo || '');
                    formData.append('Direccion_Exacta', value.Direccion_Exacta || '');

                    // Usar la cédula jurídica para la ruta
                    const cedulaJuridica = afiliadoJuridico.Cedula_Juridica || '';
                    await updateAfiliadoJuridico({ cedulaJuridica, data: formData });
                    showSuccess('¡Afiliado jurídico actualizado exitosamente!');
                }
                onClose();
            } catch (error) {
                console.error('Error actualizando:', error);
                showError('Error al actualizar el registro. Por favor intente nuevamente.');
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    const renderCharCounter = (current: number, max: number, hasError: boolean) => {
        const remaining = max - current;
        const isNearLimit = remaining <= 5;

        return (
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                    {hasError ? '' : `Máximo ${max} caracteres`}
                </span>
                <span className={`text-xs font-medium ${isNearLimit ? 'text-orange-600' : 'text-gray-500'
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


    const getModalTitle = () => {
        switch (persona.tipo) {
            case 'afiliado-fisico':
                return ' Editar Afiliado Físico';
            case 'afiliado-juridico':
                return ' Editar Afiliado Jurídico';
            default:
                return 'Editar Afiliado';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                        id="edit-afiliado-form"
                    >
                        {/* Campos para personas físicas (afiliado físico) */}
                        {persona.tipo === 'afiliado-fisico' && (
                            <>
                                <form.Field name="Nombre">
                                    {(field) => (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre *
                                            </label>
                                            <input
                                                type="text"
                                                value={field.state.value}
                                                onChange={createInputHandler('Nombre', field.handleChange, NOMBRE_MAX_LENGTH)}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(formErrors.Nombre || field.state.meta.errors?.length)
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-300 focus:ring-blue-500'
                                                    }`}
                                                placeholder="Nombre"
                                                maxLength={NOMBRE_MAX_LENGTH}
                                            />
                                            {renderCharCounter(fieldCharCounts.nombre, NOMBRE_MAX_LENGTH, !!(formErrors.Nombre || field.state.meta.errors?.length))}
                                            {formErrors.Nombre && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.Nombre}</p>
                                            )}
                                            {field.state.meta.errors?.map((err) => (
                                                <p key={err} className="text-red-500 text-xs mt-1">{err}</p>
                                            ))}
                                        </div>
                                    )}
                                </form.Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <form.Field name="Apellido1">
                                        {(field) => (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Primer Apellido *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.state.value}
                                                    onChange={createInputHandler('apellido1', field.handleChange, APELLIDO_MAX_LENGTH)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Primer apellido"
                                                    maxLength={APELLIDO_MAX_LENGTH}
                                                />
                                                {renderCharCounter(fieldCharCounts.apellido1, APELLIDO_MAX_LENGTH, false)}
                                            </div>
                                        )}
                                    </form.Field>

                                    <form.Field name="Apellido2">
                                        {(field) => (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Segundo Apellido
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.state.value}
                                                    onChange={createInputHandler('apellido2', field.handleChange, APELLIDO_MAX_LENGTH)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Segundo apellido (opcional)"
                                                    maxLength={APELLIDO_MAX_LENGTH}
                                                />
                                                {renderCharCounter(fieldCharCounts.apellido2, APELLIDO_MAX_LENGTH, false)}
                                            </div>
                                        )}
                                    </form.Field>
                                </div>

                                <form.Field name="Tipo_Identificacion">
                                    {(field) => (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tipo de Identificación * (No editable)
                                            </label>
                                            <select
                                                value={field.state.value}
                                                disabled
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                            >
                                                <option value="Cedula Nacional">Cédula Nacional</option>
                                                <option value="DIMEX">DIMEX</option>
                                                <option value="Pasaporte">Pasaporte</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Este campo no puede ser modificado
                                            </p>
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="Identificacion">
                                    {(field) => (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número de Identificación * (No editable)
                                            </label>
                                            <input
                                                type="text"
                                                value={field.state.value}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                                placeholder="Número de identificación"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Este campo no puede ser modificado
                                            </p>
                                        </div>
                                    )}
                                </form.Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <form.Field name="Edad">
                                        {(field) => (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Edad *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={field.state.value}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        field.handleChange(value);

                                                        // Validación en tiempo real
                                                        const validationError = validateField('Edad', value, persona.tipo);
                                                        if (validationError) {
                                                            setFormErrors(prev => ({ ...prev, Edad: validationError }));
                                                        } else {
                                                            setFormErrors(prev => ({ ...prev, Edad: '' }));
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${formErrors.Edad ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                                        }`}
                                                    placeholder="25"
                                                    min="18"
                                                    max="120"
                                                />
                                                {formErrors.Edad && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.Edad}</p>
                                                )}
                                            </div>
                                        )}
                                    </form.Field>
                                </div>
                            </>
                        )}

                        {/* Campos para persona jurídica */}
                        {persona.tipo === 'afiliado-juridico' && (
                            <>
                                <form.Field name="Razon_Social">
                                    {(field) => (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Razón Social *
                                            </label>
                                            <input
                                                type="text"
                                                value={field.state.value}
                                                onChange={createInputHandler('Razon_Social', field.handleChange, NOMBRE_MAX_LENGTH)}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${formErrors.Razon_Social ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                                    }`}
                                                placeholder="Empresa S.A."
                                                maxLength={NOMBRE_MAX_LENGTH}
                                            />
                                            {renderCharCounter(fieldCharCounts.razonSocial, NOMBRE_MAX_LENGTH, !!formErrors.Razon_Social)}
                                            {formErrors.Razon_Social && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.Razon_Social}</p>
                                            )}
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="Cedula_Juridica">
                                    {(field) => (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Cédula Jurídica * (No editable)
                                            </label>
                                            <input
                                                type="text"
                                                value={formatCedulaJuridica(field.state.value || '')}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                                placeholder="Cédula jurídica"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Este campo no puede ser modificado
                                            </p>
                                        </div>
                                    )}
                                </form.Field>
                            </>
                        )}

                        {/* Campos comunes para todos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <form.Field name="Numero_Telefono">
                                {(field) => (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono *
                                        </label>
                                        <PhoneInputComponent
                                            value={field.state.value || ''}
                                            onChange={(value) => {
                                                field.handleChange(value);

                                                // Validación en tiempo real
                                                const validationError = validateField('Numero_Telefono', value, persona.tipo);
                                                if (validationError) {
                                                    setFormErrors(prev => ({ ...prev, Numero_Telefono: validationError }));
                                                } else {
                                                    setFormErrors(prev => ({ ...prev, Numero_Telefono: '' }));
                                                }
                                            }}
                                            hasError={!!formErrors.Numero_Telefono}
                                        />
                                        {formErrors.Numero_Telefono && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.Numero_Telefono}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="Correo">
                                {(field) => (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Correo Electrónico *
                                        </label>
                                        <input
                                            type="email"
                                            value={field.state.value}
                                            onChange={createInputHandler('Correo', field.handleChange, EMAIL_MAX_LENGTH)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${formErrors.Correo ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="ejemplo@email.com"
                                            maxLength={EMAIL_MAX_LENGTH}
                                        />
                                        {renderCharCounter(fieldCharCounts.correo, EMAIL_MAX_LENGTH, !!formErrors.Correo)}
                                        {formErrors.Correo && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.Correo}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        <form.Field name="Direccion_Exacta">
                            {(field) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dirección Exacta
                                    </label>
                                    <textarea
                                        value={field.state.value}
                                        onChange={createInputHandler('Direccion_Exacta', field.handleChange, DIRECCION_MAX_LENGTH)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${formErrors.Direccion_Exacta ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                        placeholder="Dirección exacta de la propiedad"
                                        rows={3}
                                        maxLength={DIRECCION_MAX_LENGTH}
                                    />
                                    {renderCharCounter(fieldCharCounts.direccion, DIRECCION_MAX_LENGTH, !!formErrors.Direccion_Exacta)}
                                    {formErrors.Direccion_Exacta && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.Direccion_Exacta}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>


                    </form>
                </div>
                 <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Actualizando...
                                    </>
                                ) : (
                                    'Actualizar Afiliado'
                                )}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar actualización?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Estás seguro de que deseas actualizar este afiliado? Esta acción modificará la información existente.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                               
                                <AlertDialogAction
                                    onClick={() => {
                                        setShowConfirmDialog(false);
                                        document.getElementById('edit-afiliado-form')?.dispatchEvent(
                                            new Event('submit', { cancelable: true, bubbles: true })
                                        );
                                    }}
                                >
                                    Confirmar
                                </AlertDialogAction>
                                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
            </div>
        </div>
    );
};

export default EditModal;
