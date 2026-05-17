import { useMutation } from "@tanstack/react-query";
import axiosPrivate from "@/Api/apiAuth";
import { useAlerts } from "@/Modules/Global/context/AlertContext";

interface DownloadArgs {
    /** Path relativo del endpoint, ej: '/Proveedores/pdf' */
    url: string;
    /** Nombre del archivo descargado (sin extensión .pdf opcional). */
    filename: string;
    /** Body opcional del POST con filtros. */
    payload?: Record<string, any>;
}

/**
 * Hook genérico para descargar PDFs desde endpoints backend.
 * Hace POST con responseType: 'blob', dispara descarga automática en browser.
 * Reusable por cualquier módulo (Proveedores, Afiliados, Auditoría, etc.).
 */
export const useDownloadModulePdf = () => {
    const { showAlert } = useAlerts();

    return useMutation<void, any, DownloadArgs>({
        mutationFn: async ({ url, filename, payload }) => {
            const response = await axiosPrivate.post(url, payload ?? {}, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const downloadUrl = window.URL.createObjectURL(blob);

            const safeName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = safeName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpiar el ObjectURL en próximo tick para evitar revoke prematuro
            setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
        },
        onSuccess: () => {
            showAlert("success", "PDF descargado", "Reporte generado correctamente");
        },
        onError: async (error: any) => {
            // Si el backend devolvió error como Blob (porque responseType: 'blob'), parsear JSON
            let mensaje = "No se pudo generar el PDF";
            const data = error?.response?.data;

            if (data instanceof Blob) {
                try {
                    const text = await data.text();
                    const json = JSON.parse(text);
                    mensaje = json.message || mensaje;
                } catch {
                    // Blob no era JSON, dejar mensaje default
                }
            } else if (data?.message) {
                mensaje = data.message;
            }

            showAlert("error", "Error al generar PDF", mensaje);
        },
    });
};
