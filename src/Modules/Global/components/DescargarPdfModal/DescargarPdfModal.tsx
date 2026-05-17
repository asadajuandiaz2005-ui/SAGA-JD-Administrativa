import { useEffect, useState } from "react";
import { X, FileDown } from "lucide-react";

export type OpcionId = number | string;

export interface OpcionFiltro {
    id: OpcionId;
    label: string;
}

export interface GrupoFiltro {
    /** Llave del grupo (ej: 'estados', 'modulos', 'tipo'). Devuelto en onConfirm. */
    key: string;
    titulo: string;
    /** Texto auxiliar bajo el título. */
    ayuda?: string;
    /** Si multi (default) usa checkboxes. Si false: dropdown single-select. */
    multi?: boolean;
    opciones: OpcionFiltro[];
}

export interface OpcionColumna {
    key: string;
    label: string;
    /** Marcar como obligatoria (no se puede deseleccionar). */
    obligatoria?: boolean;
}

export interface DescargarPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Título del modal (ej: "Descargar Proveedores"). */
    titulo: string;
    /** Descripción corta debajo del título. */
    descripcion?: string;
    /** Grupos de filtros multi/single. Si undefined/empty: solo columnas + descargar. */
    grupos?: GrupoFiltro[];
    /** Opciones de columnas seleccionables. Si undefined: sección columnas oculta. */
    columnas?: OpcionColumna[];
    isLoading?: boolean;
    /**
     * Callback al confirmar. `grupos[key]` siempre es array (vacío si single sin selección).
     * `columnas` keys seleccionadas.
     */
    onConfirm: (filtros: {
        grupos: Record<string, OpcionId[]>;
        columnas: string[];
    }) => void;
}

export default function DescargarPdfModal({
    isOpen,
    onClose,
    titulo,
    descripcion,
    grupos,
    columnas,
    isLoading = false,
    onConfirm,
}: DescargarPdfModalProps) {
    const [valores, setValores] = useState<Record<string, OpcionId[]>>({});
    const [columnasSeleccionadas, setColumnasSeleccionadas] = useState<string[]>([]);

    // Reset al abrir + preseleccionar columnas (todas por default)
    useEffect(() => {
        if (isOpen) {
            const initial: Record<string, OpcionId[]> = {};
            (grupos ?? []).forEach(g => { initial[g.key] = []; });
            setValores(initial);
            setColumnasSeleccionadas(columnas?.map(c => c.key) ?? []);
        }
    }, [isOpen, grupos, columnas]);

    if (!isOpen) return null;

    const toggleValor = (key: string, id: OpcionId) => {
        setValores(prev => {
            const actuales = prev[key] ?? [];
            return {
                ...prev,
                [key]: actuales.includes(id) ? actuales.filter(v => v !== id) : [...actuales, id],
            };
        });
    };

    const setValorSingle = (key: string, id: OpcionId | "") => {
        setValores(prev => ({ ...prev, [key]: id === "" ? [] : [id] }));
    };

    const toggleColumna = (key: string) => {
        const col = columnas?.find(c => c.key === key);
        if (col?.obligatoria) return;
        setColumnasSeleccionadas(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleConfirm = () => {
        onConfirm({ grupos: valores, columnas: columnasSeleccionadas });
    };

    const hayColumnas = (columnas?.length ?? 0) > 0;

    return (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileDown className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
                            {descripcion && (
                                <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    {(grupos ?? []).map(grupo => {
                        const multi = grupo.multi !== false; // default true
                        const seleccion = valores[grupo.key] ?? [];

                        if (!multi) {
                            const valorActual = seleccion[0] ?? "";
                            return (
                                <div key={grupo.key}>
                                    <label htmlFor={`filtro-${grupo.key}`} className="block text-sm font-semibold text-gray-700 mb-2">
                                        {grupo.titulo}
                                    </label>
                                    {grupo.ayuda && (
                                        <p className="text-xs text-gray-500 mb-2">{grupo.ayuda}</p>
                                    )}
                                    <select
                                        id={`filtro-${grupo.key}`}
                                        value={String(valorActual)}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === "") return setValorSingle(grupo.key, "");
                                            const num = Number(v);
                                            setValorSingle(grupo.key, !isNaN(num) && String(num) === v ? num : v);
                                        }}
                                        disabled={isLoading}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todos</option>
                                        {grupo.opciones.map(op => (
                                            <option key={String(op.id)} value={String(op.id)}>{op.label}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        }

                        return (
                            <div key={grupo.key}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-700">{grupo.titulo}</label>
                                    <span className="text-xs text-gray-500">
                                        {seleccion.length === 0 ? "Todos" : `${seleccion.length} seleccionado(s)`}
                                    </span>
                                </div>
                                {grupo.ayuda && (
                                    <p className="text-xs text-gray-500 mb-2">{grupo.ayuda}</p>
                                )}
                                {!grupo.ayuda && (
                                    <p className="text-xs text-gray-500 mb-2">
                                        Si no selecciona ninguno se incluyen todos.
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-gray-200 rounded-md scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                                    {grupo.opciones.map(op => (
                                        <label
                                            key={String(op.id)}
                                            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={seleccion.includes(op.id)}
                                                onChange={() => toggleValor(grupo.key, op.id)}
                                                disabled={isLoading}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{op.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {hayColumnas && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Columnas en el PDF
                                </label>
                                <span className="text-xs text-gray-500">
                                    {columnasSeleccionadas.length}/{columnas!.length} seleccionada(s)
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-gray-200 rounded-md scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                                {columnas!.map(c => (
                                    <label
                                        key={c.key}
                                        className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded text-sm ${
                                            c.obligatoria ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={columnasSeleccionadas.includes(c.key)}
                                            onChange={() => toggleColumna(c.key)}
                                            disabled={isLoading || c.obligatoria}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">
                                            {c.label}
                                            {c.obligatoria && <span className="text-xs text-gray-400 ml-1">(fija)</span>}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t bg-gray-50 z-10">
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || (hayColumnas && columnasSeleccionadas.length === 0)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <FileDown className="w-4 h-4" />
                        {isLoading ? "Generando..." : "Descargar PDF"}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
