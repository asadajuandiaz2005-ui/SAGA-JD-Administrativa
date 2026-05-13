import axiosPrivate from '@/Api/apiAuth';
import type { Lectura, CreateLecturaDTO, UpdateLecturaDTO, TipoTarifaLectura } from '../model/Lectura';

const BASE_URL = '/lecturas';

const formatDateForBackend = (date: string): string => {
    // El backend espera DD-MM-YYYY; el input date del navegador entrega YYYY-MM-DD.
    const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const isoDateMatch = isoDateRegex.exec(date);

    if (!isoDateMatch) {
        return date;
    }

    const [, year, month, day] = isoDateMatch;
    return `${day}-${month}-${year}`;
};

export const getAllLecturas: () => Promise<Lectura[]> = async () => {
    const response = await axiosPrivate.get(`${BASE_URL}/all`);
    return response.data;
};

export const getTarifasLecturas = async (): Promise<TipoTarifaLectura[]> => {
    const response = await axiosPrivate.get(`${BASE_URL}/tarifas-lecturas`);
    return response.data;
};

export const getLecturasByUsuario = async (idUsuario: number): Promise<Lectura[]> => {
    const response = await axiosPrivate.get(`${BASE_URL}/usuario/${idUsuario}`);
    return response.data;
};

export const getLecturasByMedidor = async (numeroMedidor: number): Promise<Lectura[]> => {
    const response = await axiosPrivate.get(`${BASE_URL}/medidor/${numeroMedidor}`);
    return response.data;
};

export const getLecturasByAfiliado = async (idAfiliado: number): Promise<Lectura[]> => {
    const response = await axiosPrivate.get(`${BASE_URL}/afiliado/${idAfiliado}`);
    return response.data;
};

export const getLecturasEntreFechas = async (fechaInicio: string, fechaFin: string): Promise<Lectura[]> => {
    const fechaInicioFormatted = formatDateForBackend(fechaInicio);
    const fechaFinFormatted = formatDateForBackend(fechaFin);

    const response = await axiosPrivate.get(`${BASE_URL}/entre-fechas/${fechaInicioFormatted}/${fechaFinFormatted}`);
    return response.data;
};

export const getSelloCalidad = async (): Promise<boolean> => {
    const response = await axiosPrivate.get(`${BASE_URL}/sello-calidad`);
    return response.data;
}

export const importarCSVLecturas = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('CSV', file);
    
    const response = await axiosPrivate.post(`${BASE_URL}/cargar-csv`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const createLectura = async (lectura: CreateLecturaDTO): Promise<Lectura> => {
    const response = await axiosPrivate.post(`${BASE_URL}/create`, lectura);
    return response.data;
};

export const updateLectura = async (idLectura: number, lectura: UpdateLecturaDTO): Promise<Lectura> => {
    const response = await axiosPrivate.put(`${BASE_URL}/update/${idLectura}`, lectura);
    return response.data;
};

export const changeEstadoSello = async () => {
    const response = await axiosPrivate.patch(`${BASE_URL}/Aplicar-sello-calidad`);
    return response.data;
}