import { useMemo } from 'react';
import { useMedidoresPorEstado } from './useMedidores';


export const useMedidoresSinArchivos = () => {
    const { data: medidoresInstalados = [] } = useMedidoresPorEstado('instalados');

    return useMemo(() => {
        const sinArchivos = medidoresInstalados.filter(
            (m) => !m.Certificacion_Literal && !m.Planos_Terreno,
        );

        const conteoPorAfiliado = new Map<number, number>();
        for (const m of sinArchivos) {
            const idAfiliado = m.Afiliado?.Id_Afiliado;
            if (idAfiliado) {
                conteoPorAfiliado.set(idAfiliado, (conteoPorAfiliado.get(idAfiliado) ?? 0) + 1);
            }
        }

        return {
            /** Total de medidores sin archivos en todo el sistema */
            totalMedidoresSinArchivos: sinArchivos.length,
            /** Id_Afiliado → cantidad de medidores sin archivos de ese afiliado */
            conteoPorAfiliado,
            /** Set de Id_Medidor sin archivos para lookups O(1) */
            medidoresSinArchivos: new Set(sinArchivos.map((m) => m.Id_Medidor)),
        };
    }, [medidoresInstalados]);
};
