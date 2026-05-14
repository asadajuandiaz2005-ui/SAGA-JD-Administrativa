import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import {
    getAllFacturas,
    getFacturasByAfiliado,
    marcarFacturaPagada,
    marcarFacturasVencidas,
} from "../service/FacturaService";
import type { Factura, MarcarVencidasResponse } from "../model/Factura";

export const useGetFacturas = (enabled = true) => {
    return useQuery<Factura[]>({
        queryKey: ["facturas"],
        queryFn: getAllFacturas,
        enabled,
    });
};

export const useGetFacturasByAfiliado = (idAfiliado: number, enabled = true) => {
    return useQuery<Factura[]>({
        queryKey: ["facturas", "afiliado", idAfiliado],
        queryFn: () => getFacturasByAfiliado(idAfiliado),
        enabled: enabled && !!idAfiliado,
    });
};

export const useMarcarFacturaPagada = () => {
    const queryClient = useQueryClient();
    const { showAlert } = useAlerts();

    return useMutation<Factura, any, number>({
        mutationFn: (idFactura: number) => marcarFacturaPagada(idFactura),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["facturas"] });
            showAlert(
                "success",
                "Factura marcada como pagada",
                `Factura ${data.Numero_Factura} actualizada correctamente`
            );
        },
        onError: (error: any) => {
            showAlert(
                "error",
                "Error al marcar como pagada",
                error.response?.data?.message || "No se pudo actualizar la factura"
            );
        },
    });
};

export const useMarcarFacturasVencidas = () => {
    const queryClient = useQueryClient();
    const { showAlert } = useAlerts();

    return useMutation<MarcarVencidasResponse, any, void>({
        mutationFn: () => marcarFacturasVencidas(),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["facturas"] });
            showAlert(
                "success",
                "Chequeo de vencidas completado",
                `${data.facturas_actualizadas} facturas marcadas como pendientes`
            );
        },
        onError: (error: any) => {
            showAlert(
                "error",
                "Error al chequear vencidas",
                error.response?.data?.message || "No se pudo ejecutar el chequeo"
            );
        },
    });
};
