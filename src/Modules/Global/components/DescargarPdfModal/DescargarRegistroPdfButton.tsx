import { LuFileDown } from "react-icons/lu";
import { useDownloadModulePdf } from "@/Modules/Global/hooks/useDownloadModulePdf";

interface Props {
    /** Endpoint del PDF del módulo (ej: '/Proveedores/pdf'). */
    endpoint: string;
    /** ID del registro a incluir. */
    id: number | string;
    /** Prefijo del nombre de archivo (ej: 'Proveedor', 'Afiliado'). */
    filenamePrefix: string;
    /** Payload extra opcional (ej: { tipo: 1 }). */
    extraPayload?: Record<string, any>;
    /** Texto del botón. Default: 'Descargar PDF'. */
    label?: string;
    /** className override. */
    className?: string;
}

/**
 * Botón reusable para descargar PDF de un registro individual.
 * Inyecta `ids: [id]` en el payload del endpoint genérico del módulo.
 */
export default function DescargarRegistroPdfButton({
    endpoint,
    id,
    filenamePrefix,
    extraPayload,
    label = "Descargar PDF",
    className,
}: Props) {
    const { mutate: downloadPdf, isPending } = useDownloadModulePdf();

    const handleClick = () => {
        downloadPdf({
            url: endpoint,
            filename: `${filenamePrefix}_${id}_${new Date().toISOString().slice(0, 10)}`,
            payload: {
                ids: [Number(id)],
                ...(extraPayload ?? {}),
            },
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className={className ?? "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"}
            title="Descargar PDF de este registro"
        >
            <LuFileDown className="size-4" />
            {isPending ? "Generando..." : label}
        </button>
    );
}
