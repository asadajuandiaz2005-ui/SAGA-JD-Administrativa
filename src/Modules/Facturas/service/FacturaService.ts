import axiosPrivate from '@/Api/apiAuth';
import type { Factura, MarcarVencidasResponse } from '../model/Factura';

const BASE_URL = '/facturas';

export const getAllFacturas = async (): Promise<Factura[]> => {
    const response = await axiosPrivate.get(`${BASE_URL}/all`);
    return response.data;
};

export const getFacturasByAfiliado = async (idAfiliado: number): Promise<Factura[]> => {
    const response = await axiosPrivate.get(`${BASE_URL}/afiliado/${idAfiliado}`);
    return response.data;
};

export const marcarFacturaPagada = async (idFactura: number): Promise<Factura> => {
    const response = await axiosPrivate.patch(`${BASE_URL}/${idFactura}/pagar`);
    return response.data;
};

export const marcarFacturasVencidas = async (): Promise<MarcarVencidasResponse> => {
    const response = await axiosPrivate.post(`${BASE_URL}/marcar-vencidas`);
    return response.data;
};
