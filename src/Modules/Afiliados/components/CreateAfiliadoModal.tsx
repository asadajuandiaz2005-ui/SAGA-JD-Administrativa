import { useForm } from '@tanstack/react-form';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { useAfiliadosFisicos } from '../Hook/HookAfiliadoFisico';
import { useAfiliadosJuridicos } from '../Hook/HookAfiliadoJuridico';
import PhoneInputComponent from '@/Modules/Global/components/PhoneInputComponent';
import { useCedulaLookup } from '../Hook/useCedulaLookup';
import { User, Building2, X, Gauge, PlusCircle, Link2, FileText } from 'lucide-react';
import { createMedidor, asignarMedidorConArchivos } from '@/Modules/Inventario/service/MedidorServices';
import MedidorSelectorModal, { type MedidorPendiente } from './MedidorSelectorModal';
import { AfiliadoFisicoSchema } from '../Schemas/AfiliadoFisico';

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TipoFormulario = 'afiliado-fisico' | 'afiliado-juridico';

const CreateModal = ({ isOpen, onClose }: CreateModalProps) => {
    const [tipoActivo, setTipoActivo] = useState<TipoFormulario>('afiliado-fisico');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showSuccess, showError } = useAlerts();
    const { createAfiliadoFisico } = useAfiliadosFisicos();
    const { createAfiliadoJuridico } = useAfiliadosJuridicos();

    // Estados para medidores múltiples
    const [medidoresPendientes, setMedidoresPendientes] = useState<MedidorPendiente[]>([]);
    const [medidorModalOpen, setMedidorModalOpen] = useState(false);
    const [medidorModalModo, setMedidorModalModo] = useState<'asignar' | 'agregar'>('asignar');

    const { lookup, isLoading: loadingCedula, lookupJuridico, isLoadingJuridico: loadingCedulaJuridica } = useCedulaLookup()

  
    const IDENTIFICACION_LIMITS_BY_TYPE: Record<string, number> = {
        'Cedula Nacional': 9,
        'Dimex': 12,
        'Pasaporte': 12,
    };
    const IDENTIFICACION_PLACEHOLDERS_MAP: Record<string, string> = {
        'Cedula Nacional': 'Ej: 123456789',
        'Dimex': 'Ej: 120000000000',
        'Pasaporte': 'Ej: ABC123456',
    };

    // Estado para contadores de caracteres
    const [fieldCharCounts, setFieldCharCounts] = useState({
        Nombre: 0,
        Apellido1: 0,
        Apellido2: 0,
        Identificacion: 0,
        Numero_Telefono: 0,
        Correo: 0,
        Direccion_Exacta: 0,
        Razon_Social: 0,
        Cedula_Juridica: 0
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const getDefaultValues = () => {
        if (tipoActivo === 'afiliado-fisico') {
            return {
                Nombre: '',
                Apellido1: '',
                Apellido2: '',
                Tipo_Identificacion: 'Cedula Nacional' as 'Cedula Nacional' | 'Dimex' | 'Pasaporte',
                Identificacion: '',
                Numero_Telefono: '',
                Correo: '',
                Direccion_Exacta: '',
                Edad: '' as unknown as number,
            };
        } else {
            return {
                Razon_Social: '',
                Cedula_Juridica: '',
                Numero_Telefono: '',
                Correo: '',
                Direccion_Exacta: '',
            };
        }
    };

   
    const handleCedulaChange = async (cedula: string, tipoIdentificacion: string) => {
        form.setFieldValue('Identificacion', cedula);
        
        validateIdentificacionRealTime(cedula, tipoIdentificacion);

        if (tipoIdentificacion === 'Cedula Nacional' && /^\d{9}$/.test(cedula)) {
            const resultado = await lookup(cedula);
            if (resultado) {
                const nombre = resultado.firstname || '';
                const apellido1 = resultado.lastname1 || '';
                const apellido2 = resultado.lastname2 || '';
                form.setFieldValue('Nombre', nombre);
                form.setFieldValue('Apellido1', apellido1);
                form.setFieldValue('Apellido2', apellido2);
                setFieldCharCounts(prev => ({
                    ...prev,
                    Nombre: nombre.length,
                    Apellido1: apellido1.length,
                    Apellido2: apellido2.length
                }));
            }
        }
    };

   
    const validateIdentificacionRealTime = (value: string, tipoIdentificacion: string) => {
        let error = '';

        if (value && tipoIdentificacion) {
            const cleanValue = value.replaceAll(/[\s-]/g, '').toUpperCase();

            switch (tipoIdentificacion) {
                case 'Cedula Nacional':
                    if (!/^\d*$/.test(cleanValue)) {
                        error = 'La cédula solo puede contener números';
                    } else if (cleanValue.length > 0 && !/^[1-7]/.test(cleanValue)) {
                        error = 'La cédula nacional debe comenzar con un número del 1 al 7';
                    } else if (cleanValue.length > 0 && cleanValue.length !== 9 && cleanValue.length === value.length) {
                        error = 'La cédula debe tener exactamente 9 dígitos';
                    }
                    break;

                case 'Dimex':
                    if (!/^\d*$/.test(cleanValue)) {
                        error = 'El DIMEX solo puede contener números';
                    } else if (cleanValue.length > 0 && cleanValue.startsWith('0')) {
                        error = 'El DIMEX no puede empezar con 0';
                    } else if (cleanValue.length > 0 && cleanValue.length !== 12 && cleanValue.length === value.length) {
                        error = 'El DIMEX debe tener exactamente 12 dígitos';
                    }
                    break;

                case 'Pasaporte':
                    if (!/^[A-Z0-9]*$/.test(cleanValue)) {
                        error = 'El pasaporte solo puede contener letras y números';
                    } else if (cleanValue.length > 0 && cleanValue.length < 6) {
                        error = 'El pasaporte debe tener al menos 6 caracteres';
                    } else if (cleanValue.length >= 6) {
                        const letters = cleanValue.match(/[A-Z]/g);
                        if (!letters || letters.length === 0) {
                            error = 'El pasaporte debe tener al menos 1 letra';
                        } else if (letters.length > 3) {
                            error = 'El pasaporte puede tener máximo 3 letras';
                        }
                    }
                    break;
            }
        }

        setValidationErrors(prev => ({ ...prev, Identificacion: error }));
    };

    // Validaciones individuales
    const nombreSchema = z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre no puede tener más de 50 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios');

    const apellidoSchema = z.string()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .max(50, 'El apellido no puede tener más de 50 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios');

    const apellido2Schema = z.string()
        .max(50, 'El segundo apellido no puede tener más de 50 caracteres')
        .optional();

    const emailSchema = z.string()
        .min(1, 'El correo no puede estar vacío')
        .max(100, 'El correo no puede tener más de 100 caracteres')
        .email('El correo electrónico debe tener un formato válido')
        .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'El formato del correo electrónico no es válido');

    const phoneSchema = z.string()
        .min(1, 'El número de teléfono no puede estar vacío')
        .refine(
            (phone) => {
                const phoneNumber = parsePhoneNumberFromString(phone);
                return !!phoneNumber && phoneNumber.isValid();
            },
            { message: "Número de teléfono inválido" }
        );

    const direccionSchema = z.string()
        .min(10, 'La dirección debe tener al menos 10 caracteres')
        .max(255, 'La dirección no puede tener más de 255 caracteres')
        .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#-]+$/, 'La dirección solo puede contener letras, números, espacios y los caracteres .,-#');

    const edadSchema = z.coerce.number()
        .min(18, 'La edad mínima es 18 años')
        .max(90, 'La edad máxima es 90 años');

    const tipoIdSchema = z.enum(['Cedula Nacional', 'Dimex', 'Pasaporte']);

    const identificacionSchema = z.string().min(1, 'La identificación no puede estar vacía');

    const razonSocialSchema = z.string()
        .min(2, 'La razón social debe tener al menos 2 caracteres')
        .max(100, 'La razón social no puede tener más de 100 caracteres')
        .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,&()-]+$/, 'La razón social solo puede contener letras, números, espacios y los caracteres .,&()-');

    const cedulaJuridicaSchema = z.string()
        .min(1, 'La cédula jurídica no puede estar vacía')
        .refine((val) => {
            const clean = val.replaceAll(/[\s-]/g, '');
            return /^\d{10}$/.test(clean);
        }, 'La cédula jurídica debe tener exactamente 10 dígitos')
        .refine((val) => {
            const clean = val.replaceAll(/[\s-]/g, '');
            return /^[2345]/.test(clean);
        }, 'La cédula jurídica debe comenzar con 2, 3, 4 o 5');

    const handleCedulaJuridicaChange = async (cedula: string) => {
        const value = cedula.replaceAll(/[^\d\s-]/g, '');
        const digitsOnly = value.replaceAll(/[\s-]/g, '');
        if (digitsOnly.length > 10) return;

        form.setFieldValue('Cedula_Juridica', value);
        setFieldCharCounts(prev => ({ ...prev, Cedula_Juridica: value.length }));
        validateCedulaJuridicaRealTime(value);

        if (digitsOnly.length === 10) {
            const nombre = await lookupJuridico(digitsOnly);
            if (nombre) {
                form.setFieldValue('Razon_Social', nombre);
                setFieldCharCounts(prev => ({ ...prev, Razon_Social: nombre.length }));
            }
        }
    };

    const validateCedulaJuridicaRealTime = (value: string) => {
        let error = '';
        if (value) {
            const normalizedValue = value.replaceAll(/[\s-]/g, '').trim();
            if (!/^\d+$/.test(normalizedValue)) {
                error = 'La cédula jurídica debe contener solo dígitos';
            } else if (normalizedValue.length !== 10) {
                error = 'La cédula jurídica debe tener exactamente 10 dígitos';
            } else if (!/^[2345]\d{9}$/.test(normalizedValue)) {
                error = 'La cédula jurídica debe comenzar con 2, 3, 4 o 5';
            }
        }
        setValidationErrors(prev => ({ ...prev, Cedula_Juridica: error }));
    };

    // Función para crear el handler de input con validación
    const createInputHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;

            if (value.length <= maxLength) {
                handleChange(value);
                setFieldCharCounts(prev => ({ ...prev, [fieldName]: value.length }));

                // Limpiar error cuando el usuario escribe
                if (validationErrors[fieldName]) {
                    setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
                }
            }
        };
    };

    // Función para crear handler de textarea
    const createTextareaHandler = (fieldName: string, handleChange: (value: string) => void, maxLength: number) => {
        return (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value;

            if (value.length <= maxLength) {
                handleChange(value);
                setFieldCharCounts(prev => ({ ...prev, [fieldName]: value.length }));

                // Limpiar error cuando el usuario escribe
                if (validationErrors[fieldName]) {
                    setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
                }
            }
        };
    };

    // Función para renderizar contador de caracteres
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

    const renderError = (fieldName: string, fieldErrors: any[]) => {
        const customError = validationErrors[fieldName];
        const submitError = formErrors[fieldName];
        const formError = fieldErrors.length > 0 ? String(fieldErrors[0]) : null;
        const errorMessage = customError || submitError || formError;

        if (errorMessage) {
            return <p className="text-red-500 text-xs mt-1">{errorMessage}</p>;
        }
        return null;
    };

    const form = useForm({
        defaultValues: getDefaultValues(),
        onSubmit: async ({ value }) => {
            if (isSubmitting) return;

            setFormErrors({});

            if (tipoActivo === 'afiliado-fisico') {
                const fisicoData = {
                    Nombre: value.Nombre || '',
                    Apellido1: value.Apellido1 || '',
                    Apellido2: value.Apellido2 || undefined,
                    Tipo_Identificacion: (value.Tipo_Identificacion as any) || 'Cedula Nacional',
                    Identificacion: value.Identificacion || '',
                    Numero_Telefono: value.Numero_Telefono || '',
                    Correo: value.Correo || '',
                    Direccion_Exacta: value.Direccion_Exacta || '',
                    Edad: value.Edad,
                };
                const validation = AfiliadoFisicoSchema.safeParse(fisicoData);
                if (!validation.success) {
                    const fieldErrors: Record<string, string> = {};
                    validation.error.errors.forEach((err) => {
                        const field = err.path[0] as string;
                        if (!fieldErrors[field]) fieldErrors[field] = err.message;
                    });
                    setFormErrors(fieldErrors);
                    return;
                }
            }

            try {
                setIsSubmitting(true);

                // Crear FormData para enviar archivos
                const formData = new FormData();

                if (tipoActivo === 'afiliado-fisico') {
                    // Agregar campos de afiliado físico
                    formData.append('Nombre', value.Nombre || '');
                    formData.append('Apellido1', value.Apellido1 || '');
                    formData.append('Apellido2', value.Apellido2 || '');
                    formData.append('Tipo_Identificacion', value.Tipo_Identificacion || 'Cedula Nacional');
                    formData.append('Identificacion', value.Identificacion || '');
                    formData.append('Numero_Telefono', value.Numero_Telefono || '');
                    formData.append('Correo', value.Correo || '');
                    formData.append('Direccion_Exacta', value.Direccion_Exacta || '');
                    formData.append('Edad', value.Edad?.toString() || '0');

                    // El primer medidor se envía junto al CREATE del afiliado
                    const primerMedidor = medidoresPendientes[0];
                    if (primerMedidor) {
                        formData.append('Opcion_Medidor', primerMedidor.tipo === 'asignar' ? 'asignar' : 'agregar');
                        if (primerMedidor.tipo === 'asignar') {
                            formData.append('Id_Medidor', String(primerMedidor.idMedidor));
                        } else {
                            formData.append('Numero_Medidor', String(primerMedidor.numeroMedidor));
                        }
                        formData.append('Certificacion_Literal', primerMedidor.escrituraFile);
                        formData.append('Planos_Terreno', primerMedidor.planosFile);
                        formData.append('Estado_Pago_Medidor', primerMedidor.estadoPago);
                    } else {
                        formData.append('Opcion_Medidor', 'sin_medidor');
                    }

                    const creadoF = await createAfiliadoFisico(formData);
                    const idCreadoF: number = creadoF?.Id_Afiliado ?? creadoF?.id ?? null;
                    // Medidores adicionales (índice > 0) se asignan por separado con archivos
                    if (idCreadoF && medidoresPendientes.length > 1) {
                        for (const mp of medidoresPendientes.slice(1)) {
                            if (mp.tipo === 'asignar') {
                                await asignarMedidorConArchivos(mp.idMedidor, idCreadoF, mp.escrituraFile, mp.planosFile, mp.estadoPago);
                            } else {
                                const nuevo = await createMedidor({ Numero_Medidor: mp.numeroMedidor });
                                await asignarMedidorConArchivos(nuevo.Id_Medidor, idCreadoF, mp.escrituraFile, mp.planosFile, mp.estadoPago);
                            }
                        }
                    }
                    showSuccess('Éxito', 'Afiliado físico creado exitosamente.');
                } else {
                    // Agregar campos de afiliado jurídico
                    formData.append('Razon_Social', value.Razon_Social || '');
                    formData.append('Cedula_Juridica', (value.Cedula_Juridica || '').replaceAll(/[\s-]/g, ''));
                    formData.append('Numero_Telefono', value.Numero_Telefono || '');
                    formData.append('Correo', value.Correo || '');
                    formData.append('Direccion_Exacta', value.Direccion_Exacta || '');

                    // El primer medidor se envía junto al CREATE del afiliado
                    const primerMedidorJ = medidoresPendientes[0];
                    if (primerMedidorJ) {
                        formData.append('Opcion_Medidor', primerMedidorJ.tipo === 'asignar' ? 'asignar' : 'agregar');
                        if (primerMedidorJ.tipo === 'asignar') {
                            formData.append('Id_Medidor', String(primerMedidorJ.idMedidor));
                        } else {
                            formData.append('Numero_Medidor', String(primerMedidorJ.numeroMedidor));
                        }
                        formData.append('Certificacion_Literal', primerMedidorJ.escrituraFile);
                        formData.append('Planos_Terreno', primerMedidorJ.planosFile);
                        formData.append('Estado_Pago_Medidor', primerMedidorJ.estadoPago);
                    } else {
                        formData.append('Opcion_Medidor', 'sin_medidor');
                    }

                    const creadoJ = await createAfiliadoJuridico(formData);
                    const idCreadoJ: number = creadoJ?.Id_Afiliado ?? creadoJ?.id ?? null;
                    // Medidores adicionales (índice > 0) se asignan por separado con archivos
                    if (idCreadoJ && medidoresPendientes.length > 1) {
                        for (const mp of medidoresPendientes.slice(1)) {
                            if (mp.tipo === 'asignar') {
                                await asignarMedidorConArchivos(mp.idMedidor, idCreadoJ, mp.escrituraFile, mp.planosFile, mp.estadoPago);
                            } else {
                                const nuevo = await createMedidor({ Numero_Medidor: mp.numeroMedidor });
                                await asignarMedidorConArchivos(nuevo.Id_Medidor, idCreadoJ, mp.escrituraFile, mp.planosFile, mp.estadoPago);
                            }
                        }
                    }
                    showSuccess('Éxito', 'Afiliado jurídico creado exitosamente.');
                }

                // Cerrar modal y resetear formulario
                onClose();
                form.reset();
                setMedidoresPendientes([]);
                setMedidorModalOpen(false);

            } catch (error: any) {
                console.error('Error creando registro:', error);
                const raw = error?.response?.data?.message;
                const msg = Array.isArray(raw) ? raw.join('\n') : raw || 'Error al crear el registro. Por favor intente nuevamente.';
                showError('Error', msg);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // Resetear el formulario cuando cambie el tipo de afiliado
    useEffect(() => {
        form.reset();
        setFieldCharCounts({
            Nombre: 0,
            Apellido1: 0,
            Apellido2: 0,
            Identificacion: 0,
            Numero_Telefono: 0,
            Correo: 0,
            Direccion_Exacta: 0,
            Razon_Social: 0,
            Cedula_Juridica: 0
        });
        setValidationErrors({});
        setFormErrors({});
        setMedidoresPendientes([]);
        setMedidorModalOpen(false);
    }, [tipoActivo]);

    // Mover la verificación de isOpen DESPUÉS de todos los hooks
    if (!isOpen) return null;

    // ─── Handlers medidores ───────────────────────────────────────────────────────
    const handleConfirmarMedidor = (mp: MedidorPendiente) => {
        setMedidoresPendientes(prev => [...prev, mp]);
        setMedidorModalOpen(false);
    };

    const handleQuitarMedidor = (uid: string) => {
        setMedidoresPendientes(prev => prev.filter(p => p.uid !== uid));
    };

    const renderSeccionMedidor = () => (
        <div className="mt-6 pt-5 border-t border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-700">Medidores <span className="text-gray-400 font-normal">(opcional)</span></h3>
                </div>
                {medidoresPendientes.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{medidoresPendientes.length} en lista</span>
                )}
            </div>

            {medidoresPendientes.length > 0 && (
                <ul className="space-y-2">
                    {medidoresPendientes.map(mp => (
                        <li key={mp.uid} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                                {mp.tipo === 'asignar'
                                    ? <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                                    : <PlusCircle className="w-4 h-4 text-blue-500 shrink-0" />}
                                <span className="text-sm font-medium text-gray-800">Medidor #{mp.numeroMedidor}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                    {mp.tipo === 'asignar' ? 'Asignar' : 'Nuevo'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                                    <FileText className="w-3 h-3 text-blue-400" />
                                    <span>2 docs</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleQuitarMedidor(mp.uid)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => { setMedidorModalModo('asignar'); setMedidorModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <Link2 className="w-4 h-4" /> Asignar existente
                </button>
                <button
                    type="button"
                    onClick={() => { setMedidorModalModo('agregar'); setMedidorModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <PlusCircle className="w-4 h-4" /> Agregar nuevo
                </button>
            </div>
        </div>
    );

    const renderFormularioFisico = () => (
        <>
            {/* Tipo de Identificación */}
            <form.Field
                name="Tipo_Identificacion"
                validators={{
                    onChange: ({ value }) => {
                        const result = tipoIdSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Tipo_Identificacion" className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Identificación <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="Tipo_Identificacion"
                            value={field.state.value}
                            onChange={(e) => {
                                field.handleChange(e.target.value as 'Cedula Nacional' | 'Dimex' | 'Pasaporte');
                                // Al cambiar tipo, limpiar identificación y sus errores
                                form.setFieldValue('Identificacion', '');
                                setFieldCharCounts(prev => ({ ...prev, Identificacion: 0 }));
                                setValidationErrors(prev => ({ ...prev, Identificacion: '' }));
                                setFormErrors(prev => ({ ...prev, Identificacion: '' }));
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                (field.state.meta.errors.length > 0 || formErrors.Tipo_Identificacion)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                        >
                            <option value="Cedula Nacional">Cédula Nacional</option>
                            <option value="Dimex">DIMEX</option>
                            <option value="Pasaporte">Pasaporte</option>
                        </select>
                        {renderError('Tipo_Identificacion', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            {/* Identificación */}
            <form.Field
                name="Identificacion"
                validators={{
                    onChange: ({ value }) => {
                        const result = identificacionSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <form.Field name="Tipo_Identificacion">
                        {(tipoField) => {
                            const tipoIdentificacion: string = (tipoField.state.value as string) ?? 'Cedula Nacional';
                            const maxLength = IDENTIFICACION_LIMITS_BY_TYPE[tipoIdentificacion] ?? 20;
                            const placeholder = IDENTIFICACION_PLACEHOLDERS_MAP[tipoIdentificacion] ?? 'Ingrese la identificación';

                            return (
                                <div>
                                    <label htmlFor="Identificacion" className="block text-sm font-medium text-gray-700 mb-1">
                                        {tipoIdentificacion || 'Identificación'} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="Identificacion"
                                            type="text"
                                            value={field.state.value}
                                            onChange={async (e) => {
                                                const value = e.target.value;
                                                if (value.length <= maxLength) {
                                                    setFieldCharCounts(prev => ({ ...prev, Identificacion: value.length }));
                                                    await handleCedulaChange(value, tipoIdentificacion);
                                                }
                                            }}
                                            onBlur={field.handleBlur}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                                (field.state.meta.errors.length > 0 || validationErrors.Identificacion || formErrors.Identificacion)
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                            placeholder={placeholder}
                                            maxLength={maxLength}
                                            disabled={!tipoIdentificacion || loadingCedula}
                                        />
                                        {loadingCedula && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>

                                    {renderCharCounter(
                                        fieldCharCounts.Identificacion,
                                        maxLength,
                                        field.state.meta.errors.length > 0 || !!validationErrors.Identificacion || !!formErrors.Identificacion
                                    )}

                                    {renderError('Identificacion', field.state.meta.errors)}
                                </div>
                            );
                        }}
                    </form.Field>
                )}
            </form.Field>

            {/* Nombre */}
            <form.Field
                name="Nombre"
                validators={{
                    onChange: ({ value }) => {
                        const result = nombreSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Nombre" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Nombre"
                            type="text"
                            value={field.state.value}
                            onChange={createInputHandler('Nombre', field.handleChange, 50)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Nombre)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="Tu nombre"
                            maxLength={50}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Nombre,
                            50,
                            field.state.meta.errors.length > 0 || !!validationErrors.Nombre
                        )}

                        {renderError('Nombre', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            {/* Primer Apellido */}
            <form.Field
                name="Apellido1"
                validators={{
                    onChange: ({ value }) => {
                        const result = apellidoSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Apellido1" className="block text-sm font-medium text-gray-700 mb-1">
                            Primer Apellido <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Apellido1"
                            type="text"
                            value={field.state.value}
                            onChange={createInputHandler('Apellido1', field.handleChange, 50)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Apellido1)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="Tu primer apellido"
                            maxLength={50}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Apellido1,
                            50,
                            field.state.meta.errors.length > 0 || !!validationErrors.Apellido1
                        )}

                        {renderError('Apellido1', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            {/* Segundo Apellido */}
            <form.Field
                name="Apellido2"
                validators={{
                    onChange: ({ value }) => {
                        const result = apellido2Schema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Apellido2" className="block text-sm font-medium text-gray-700 mb-1">
                            Segundo Apellido <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Apellido2"
                            type="text"
                            value={field.state.value}
                            onChange={createInputHandler('Apellido2', field.handleChange, 50)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Apellido2)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="Tu segundo apellido"
                            maxLength={50}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Apellido2,
                            50,
                            field.state.meta.errors.length > 0 || !!validationErrors.Apellido2
                        )}

                        {renderError('Apellido2', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            <form.Field
                name="Numero_Telefono"
                validators={{
                    onChange: ({ value }) => {
                        const result = phoneSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Teléfono <span className="text-red-500">*</span>
                        </label>
                        <PhoneInputComponent
                            value={field.state.value || ''}
                            onChange={(value) => field.handleChange(value)}
                            onBlur={field.handleBlur}
                            hasError={field.state.meta.errors.length > 0}
                        />
                        {renderError('Numero_Telefono', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            <form.Field
                name="Correo"
                validators={{
                    onChange: ({ value }) => {
                        const result = emailSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Correo" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Correo"
                            type="email"
                            value={field.state.value}
                            onChange={createInputHandler('Correo', field.handleChange, 100)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Correo)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="ejemplo@email.com"
                            maxLength={100}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Correo,
                            100,
                            field.state.meta.errors.length > 0 || !!validationErrors.Correo
                        )}

                        {renderError('Correo', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            <form.Field
                name="Direccion_Exacta"
                validators={{
                    onChange: ({ value }) => {
                        const result = direccionSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Direccion_Exacta" className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección Exacta <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="Direccion_Exacta"
                            value={field.state.value}
                            onChange={createTextareaHandler('Direccion_Exacta', field.handleChange, 255)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Direccion_Exacta)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="Dirección exacta de la propiedad"
                            rows={3}
                            maxLength={255}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Direccion_Exacta,
                            255,
                            field.state.meta.errors.length > 0 || !!validationErrors.Direccion_Exacta
                        )}

                        {renderError('Direccion_Exacta', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            <form.Field
                name="Edad"
                validators={{
                    onChange: ({ value }) => {
                        const result = edadSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Edad" className="block text-sm font-medium text-gray-700 mb-1">
                            Edad <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Edad"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => {
                                const raw = e.target.value;
                                field.handleChange(raw === '' ? ('' as unknown as number) : Number.parseInt(raw));
                            }}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${field.state.meta.errors.length > 0
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="19"
                            min="18"
                            max="120"
                        />
                        {renderError('Edad', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

        </>
    );

    const renderFormularioJuridico = () => (
        <>
            {/* Cédula Jurídica */}
            <form.Field
                name="Cedula_Juridica"
                validators={{
                    onChange: ({ value }) => {
                        const result = cedulaJuridicaSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Cedula_Juridica" className="block text-sm font-medium text-gray-700 mb-1">
                            Cédula Jurídica <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="Cedula_Juridica"
                                type="text"
                                value={field.state.value}
                                onChange={async (e) => { await handleCedulaJuridicaChange(e.target.value); }}
                                onBlur={field.handleBlur}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Cedula_Juridica || formErrors.Cedula_Juridica)
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                placeholder="Ej: 3101654321 o 3-101-654321"
                                maxLength={14}
                                disabled={loadingCedulaJuridica}
                            />
                            {loadingCedulaJuridica && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>

                        {renderCharCounter(
                            fieldCharCounts.Cedula_Juridica,
                            13,
                            field.state.meta.errors.length > 0 || !!validationErrors.Cedula_Juridica || !!formErrors.Cedula_Juridica
                        )}

                        {renderError('Cedula_Juridica', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            {/* Razón Social */}
            <form.Field
                name="Razon_Social"
                validators={{
                    onChange: ({ value }) => {
                        const result = razonSocialSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Razon_Social" className="block text-sm font-medium text-gray-700 mb-1">
                            Razón Social <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Razon_Social"
                            type="text"
                            value={field.state.value}
                            onChange={createInputHandler('Razon_Social', field.handleChange, 100)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Razon_Social)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="Empresa S.A."
                            maxLength={100}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Razon_Social,
                            100,
                            field.state.meta.errors.length > 0 || !!validationErrors.Razon_Social
                        )}

                        {renderError('Razon_Social', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            {/* Número de Teléfono */}
            <form.Field
                name="Numero_Telefono"
                validators={{
                    onChange: ({ value }) => {
                        const result = phoneSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Teléfono <span className="text-red-500">*</span>
                        </label>
                        <PhoneInputComponent
                            value={field.state.value || ''}
                            onChange={(value) => field.handleChange(value)}
                            onBlur={field.handleBlur}
                            hasError={field.state.meta.errors.length > 0}
                        />
                        {renderError('Numero_Telefono', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            <form.Field
                name="Correo"
                validators={{
                    onChange: ({ value }) => {
                        const result = emailSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Correo_Juridico" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="Correo_Juridico"
                            type="email"
                            value={field.state.value}
                            onChange={createInputHandler('Correo', field.handleChange, 100)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Correo)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="ejemplo@email.com"
                            maxLength={100}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Correo,
                            100,
                            field.state.meta.errors.length > 0 || !!validationErrors.Correo
                        )}

                        {renderError('Correo', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

            <form.Field
                name="Direccion_Exacta"
                validators={{
                    onChange: ({ value }) => {
                        const result = direccionSchema.safeParse(value);
                        return result.success ? undefined : result.error.errors[0].message;
                    },
                }}
            >
                {(field) => (
                    <div>
                        <label htmlFor="Direccion_Exacta_Juridico" className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección Exacta <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="Direccion_Exacta_Juridico"
                            value={field.state.value}
                            onChange={createTextareaHandler('Direccion_Exacta', field.handleChange, 255)}
                            onBlur={field.handleBlur}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${(field.state.meta.errors.length > 0 || validationErrors.Direccion_Exacta)
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="Dirección exacta de la propiedad"
                            rows={3}
                            maxLength={255}
                        />

                        {renderCharCounter(
                            fieldCharCounts.Direccion_Exacta,
                            255,
                            field.state.meta.errors.length > 0 || !!validationErrors.Direccion_Exacta
                        )}

                        {renderError('Direccion_Exacta', field.state.meta.errors)}
                    </div>
                )}
            </form.Field>

        </>
    );

    const renderFormulario = () => {
        if (tipoActivo === 'afiliado-fisico') {
            return renderFormularioFisico();
        } else {
            return renderFormularioJuridico();
        }
    };

    return (
        <>
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {tipoActivo === 'afiliado-fisico' ? (
                            <User className="w-6 h-6 text-blue-600" />
                        ) : (
                            <Building2 className="w-6 h-6 text-blue-600" />
                        )}
                        <h2 className="text-xl font-semibold text-gray-900">
                            Nuevo afiliado {tipoActivo === 'afiliado-fisico' ? 'físico' : 'jurídico'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Botones para cambiar tipo de afiliado */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setTipoActivo('afiliado-fisico');
                                form.reset();
                                setValidationErrors({});
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-1 justify-center ${tipoActivo === 'afiliado-fisico'
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Físico
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTipoActivo('afiliado-juridico');
                                form.reset();
                                setValidationErrors({});
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-1 justify-center ${tipoActivo === 'afiliado-juridico'
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Building2 className="w-4 h-4" />
                            Jurídico
                        </button>
                    </div>
                </div>

                {/* Contenido del formulario */}
                <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 max-h-[calc(90vh-280px)]">
                    <form
                        id="afiliado-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        {renderFormulario()}
                    </form>
                    {renderSeccionMedidor()}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                        type="submit"
                        form="afiliado-form"
                        disabled={isSubmitting}
                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${isSubmitting
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Creando...' : `Crear Afiliado ${tipoActivo === 'afiliado-fisico' ? 'Físico' : 'Jurídico'}`}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={isSubmitting}
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

export default CreateModal;