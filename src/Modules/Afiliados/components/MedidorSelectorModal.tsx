import React, { useState, useEffect } from 'react';
import { X, Search, Link2, PlusCircle, CheckCircle2, FileText, Gauge, Upload } from 'lucide-react';
import { getMedidoresDisponibles } from '@/Modules/Inventario/service/MedidorServices';
import type { Medidor } from '@/Modules/Inventario/models/Inventario';

export type EstadoPago = 'Pagado' | 'Pendiente';

export type MedidorPendiente =
    | { uid: string; tipo: 'asignar'; idMedidor: number; numeroMedidor: number | string; escrituraFile: File; planosFile: File; estadoPago: EstadoPago }
    | { uid: string; tipo: 'agregar'; numeroMedidor: number; escrituraFile: File; planosFile: File; estadoPago: EstadoPago };

interface MedidorSelectorModalProps {
    isOpen: boolean;
    modo: 'asignar' | 'agregar';
    onClose: () => void;
    onConfirm: (mp: MedidorPendiente) => void;
}

const MedidorSelectorModal: React.FC<MedidorSelectorModalProps> = ({ isOpen, modo, onClose, onConfirm }) => {
    const [searchMedidor, setSearchMedidor] = useState('');
    const [medidoresDisponibles, setMedidoresDisponibles] = useState<Medidor[]>([]);
    const [loadingMedidores, setLoadingMedidores] = useState(false);
    const [medidorSeleccionado, setMedidorSeleccionado] = useState<Medidor | null>(null);
    const [numeroNuevo, setNumeroNuevo] = useState('');
    const [escrituraFile, setEscrituraFile] = useState<File | null>(null);
    const [planosFile, setPlanosFile] = useState<File | null>(null);
    const [estadoPago, setEstadoPago] = useState<EstadoPago | ''>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setSearchMedidor('');
        setMedidorSeleccionado(null);
        setNumeroNuevo('');
        setEscrituraFile(null);
        setPlanosFile(null);
        setEstadoPago('');
        setErrors({});
        if (modo === 'asignar') {
            setLoadingMedidores(true);
            getMedidoresDisponibles()
                .then(setMedidoresDisponibles)
                .catch(() => {})
                .finally(() => setLoadingMedidores(false));
        }
    }, [isOpen, modo]);

    if (!isOpen) return null;

    const medidoresFiltrados = medidoresDisponibles.filter(m =>
        !searchMedidor.trim() || String(m.Numero_Medidor).includes(searchMedidor.trim())
    );

    const handleConfirm = () => {
        const newErrors: Record<string, string> = {};

        if (modo === 'asignar' && !medidorSeleccionado) {
            newErrors.medidor = 'Debe seleccionar un medidor de la lista';
        }

        if (modo === 'agregar') {
            const num = parseInt(numeroNuevo);
            if (Number.isNaN(num) || num < 100000) {
                newErrors.numero = 'El número debe tener al menos 6 dígitos y no puede empezar con 0';
            } else if (num > 99999999) {
                newErrors.numero = 'El número no puede tener más de 8 dígitos';
            }
        }

        if (!escrituraFile) newErrors.escritura = 'La certificación literal del terreno es requerida';
        if (!planosFile) newErrors.planos = 'Los planos del terreno son requeridos';
        if (!estadoPago) newErrors.estadoPago = 'Debe seleccionar el estado de pago';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (modo === 'asignar' && medidorSeleccionado) {
            onConfirm({
                uid: crypto.randomUUID(),
                tipo: 'asignar',
                idMedidor: medidorSeleccionado.Id_Medidor,
                numeroMedidor: medidorSeleccionado.Numero_Medidor,
                escrituraFile: escrituraFile!,
                planosFile: planosFile!,
                estadoPago: estadoPago as EstadoPago,
            });
        } else if (modo === 'agregar') {
            onConfirm({
                uid: crypto.randomUUID(),
                tipo: 'agregar',
                numeroMedidor: parseInt(numeroNuevo),
                escrituraFile: escrituraFile!,
                planosFile: planosFile!,
                estadoPago: estadoPago as EstadoPago,
            });
        }
    };

    const renderFileInput = (
        label: string,
        file: File | null,
        onChange: (f: File | null) => void,
        errorKey: string
    ) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        onChange(f);
                        if (f && errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: '' }));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full px-3 py-2.5 border rounded-lg bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors ${errors[errorKey] ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                        {file
                            ? <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            : <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                        }
                        <span className={`text-sm truncate ${file ? 'text-gray-800' : 'text-gray-400'}`}>
                            {file ? file.name : 'Seleccionar archivo...'}
                        </span>
                    </div>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded text-xs shrink-0 ml-2">
                        {file ? 'Cambiar' : 'Subir'}
                    </span>
                </div>
            </div>
            {errors[errorKey] && <p className="text-red-500 text-xs mt-1">{errors[errorKey]}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            {modo === 'asignar'
                                ? <Link2 className="w-4 h-4 text-blue-600" />
                                : <PlusCircle className="w-4 h-4 text-blue-600" />
                            }
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                {modo === 'asignar' ? 'Asignar Medidor Existente' : 'Agregar Nuevo Medidor'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {modo === 'asignar'
                                    ? 'Seleccione un medidor y adjunte los documentos del terreno'
                                    : 'Ingrese el número y adjunte los documentos del terreno'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">

                    {/* Sección del medidor */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Gauge className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-700">
                                {modo === 'asignar' ? 'Seleccionar Medidor' : 'Número de Medidor'}
                            </h3>
                        </div>

                        {modo === 'asignar' ? (
                            <>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por número..."
                                        value={searchMedidor}
                                        onChange={e => setSearchMedidor(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto bg-white">
                                    {loadingMedidores ? (
                                        <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                            Cargando medidores...
                                        </div>
                                    ) : medidoresFiltrados.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-gray-400">No hay medidores disponibles</p>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {medidoresFiltrados.map(m => {
                                                const selected = medidorSeleccionado?.Id_Medidor === m.Id_Medidor;
                                                return (
                                                    <li key={m.Id_Medidor}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMedidorSeleccionado(m);
                                                                if (errors.medidor) setErrors(prev => ({ ...prev, medidor: '' }));
                                                            }}
                                                            className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors text-sm ${
                                                                selected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-800'
                                                            }`}
                                                        >
                                                            <span className="font-medium">Medidor #{m.Numero_Medidor}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">{m.Estado_Medidor?.Nombre_Estado_Medidor}</span>
                                                                {selected && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                                            </div>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>

                                {medidorSeleccionado && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span className="text-sm text-blue-700 font-medium">
                                            Seleccionado: Medidor #{medidorSeleccionado.Numero_Medidor}
                                        </span>
                                    </div>
                                )}
                                {errors.medidor && <p className="text-red-500 text-xs mt-1">{errors.medidor}</p>}
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={numeroNuevo}
                                    onChange={e => {
                                        const val = e.target.value.replaceAll(/\D/g, '');
                                        if (val.length <= 8) {
                                            setNumeroNuevo(val);
                                            if (errors.numero) setErrors(prev => ({ ...prev, numero: '' }));
                                        }
                                    }}
                                    placeholder="Ej: 100230 (mínimo 6 dígitos)"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.numero ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                />
                                {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
                                <p className="text-xs text-gray-500 mt-1.5">
                                    El medidor se creará automáticamente al guardar el afiliado.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-100" />

                    {/* Estado de Pago */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado de Pago <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={estadoPago}
                            onChange={(e) => {
                                setEstadoPago(e.target.value as EstadoPago | '');
                                if (errors.estadoPago) setErrors(prev => ({ ...prev, estadoPago: '' }));
                            }}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                errors.estadoPago ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccione estado de pago</option>
                            <option value="Pagado">Pagado</option>
                            <option value="Pendiente">Pendiente</option>
                        </select>
                        {errors.estadoPago && <p className="text-red-500 text-xs mt-1">{errors.estadoPago}</p>}
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-100" />

                    {/* Documentos del terreno */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-700">Documentos del Terreno</h3>
                        </div>
                        {renderFileInput('Certificación Literal', escrituraFile, setEscrituraFile, 'escritura')}
                        {renderFileInput('Planos del Terreno', planosFile, setPlanosFile, 'planos')}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Confirmar
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedidorSelectorModal;
