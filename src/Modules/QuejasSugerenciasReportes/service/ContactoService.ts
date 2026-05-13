import axiosPrivate from "@/Api/apiAuth";

export const responderQueja = async (idQueja: number, Respuesta: string) => {
    const response = await axiosPrivate.patch(`/quejas/${idQueja}/responder`, { Respuesta });
    return response.data;
}

export const responderSugerencia = async (idSugerencia: number, Respuesta: string) => {
    const response = await axiosPrivate.patch(`/sugerencias/${idSugerencia}/responder`, { Respuesta });
    return response.data;
}

export const responderReporte = async (idReporte: number, Respuesta: string) => {
    const response = await axiosPrivate.patch(`/reportes/${idReporte}/responder`, { Respuesta });
    return response.data;
}
export const obtenerQuejas = async () => {
    const response = await axiosPrivate.get('/quejas');
    return response.data;
}

export const obtenerQuejasPendientes = async () => {
    const response = await axiosPrivate.get('/quejas/pendientes');
    return response.data;
}

export const obtenerQuejasContestadas = async () => {
    const response = await axiosPrivate.get('/quejas/contestadas');
    return response.data;
}

export const obtenerQuejasArchivadas = async () => {
    const response = await axiosPrivate.get('/quejas/archivados');
    return response.data;
}

export const obtenerSugerencias = async () => {
    const response = await axiosPrivate.get('/sugerencias');
    return response.data;
}

export const obtenerSugerenciasPendientes = async () => {
    const response = await axiosPrivate.get('/sugerencias/pendientes');
    return response.data;
}

export const obtenerSugerenciasContestadas = async () => {
    const response = await axiosPrivate.get('/sugerencias/contestadas');
    return response.data;
}

export const obtenerSugerenciasArchivadas = async () => {
    const response = await axiosPrivate.get('/sugerencias/archivados');
    return response.data;
}

export const obtenerReportes = async () => {
    const response = await axiosPrivate.get('/reportes');
    return response.data;
}

export const obtenerReportesPendientes = async () => {
    const response = await axiosPrivate.get('/reportes/pendientes');
    return response.data;
}

export const obtenerReportesContestadas = async () => {
    const response = await axiosPrivate.get('/reportes/contestadas');
    return response.data;
}

export const obtenerReportesArchivados = async () => {
    const response = await axiosPrivate.get('/reportes/archivados');
    return response.data;
}
export const actualizarEstadoReporte = async (idReporte: number, Id_Estado_Reporte: number) => {
    const response = await axiosPrivate.patch(`/reportes/${idReporte}/estado`, { Id_Estado_Reporte });
    return response.data;
}
export const actualizarEstadoSugerencia = async (idSugerencia: number, Id_Estado_Sugerencia: number) => {
    const response = await axiosPrivate.patch(`/sugerencias/${idSugerencia}/estado`, { Id_Estado_Sugerencia });
    return response.data;
}
export const actualizarEstadoQueja = async (idQueja: number, Id_Estado_Queja: number) => {
    const response = await axiosPrivate.patch(`/quejas/${idQueja}/estado`, { Id_Estado_Queja });
    return response.data;
}
