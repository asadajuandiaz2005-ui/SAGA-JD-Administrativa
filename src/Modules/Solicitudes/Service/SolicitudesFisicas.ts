import apiAuth from "@/Api/apiAuth";
import type {
    SolicitudFisica,
    SolicitudFisicaBase,
    SolicitudAfiliacionFisica,
    SolicitudDesconexionFisica,
    SolicitudCambioMedidorFisica,
    SolicitudAsociadoFisica,
    SolicitudAgregarMedidorFisica,
    CreateSolicitudAgregarMedidorFisicaDTO,
    CreateSolicitudAsociadoFisicaDTO
} from "../Models/ModelosFisicas";
import { toTipoSolicitudSlug } from "../utils/tipoSolicitud";

export async function getSolicitudesFisicas(): Promise<SolicitudFisica[]> {
    try {
        let response;

        try {
            response = await apiAuth.get("/solicitudes-fisicas/all");
        } catch (error) {
            console.error("Error al obtener solicitudes físicas:", error);
            throw error;
        }

        let solicitudesFinales: SolicitudFisica[] = [];

        // Verificar si el backend devuelve directamente un array o un objeto con propiedades
        if (Array.isArray(response.data)) {

            // El backend devuelve directamente un array de solicitudes
            solicitudesFinales = response.data.map((solicitud: any) => {

                // Determinar el tipo de solicitud basado en Id_Tipo_Solicitud
                let tipo = 'Afiliacion';
                switch (solicitud.Id_Tipo_Solicitud) {
                    case 1: tipo = 'Afiliacion'; break;
                    case 2: tipo = 'Desconexion'; break;
                    case 3: tipo = 'Cambio de Medidor'; break;
                    case 4: tipo = 'Asociado'; break;
                    case 5: tipo = 'Agregar Medidor'; break;
                    default: tipo = 'Afiliacion';
                }

                return {
                    ...solicitud,
                    Tipo_Solicitud: tipo
                };
            });

        } else if (response.data && typeof response.data === 'object') {
            const data = response.data;

            // Mapear tipos de solicitud del backend a tipos esperados (estructura real del backend)
            const tiposSolicitud = [
                { key: 'Afiliacion', tipo: 'Afiliacion' },
                { key: 'Asociado', tipo: 'Asociado' },
                { key: 'Cambio De Medidor', tipo: 'Cambio de Medidor' },  
                { key: 'Desconexion', tipo: 'Desconexion' },
                { key: 'Agregar Medidor', tipo: 'Agregar Medidor' }
            ];

            tiposSolicitud.forEach(({ key, tipo }) => {
                if (data[key] && Array.isArray(data[key])) {

                    // Agregar el tipo de solicitud a cada registro
                    const solicitudesConTipo = data[key].map((solicitud: any) => ({
                        ...solicitud,
                        Tipo_Solicitud: tipo
                    }));

                    solicitudesFinales = [...solicitudesFinales, ...solicitudesConTipo];
                }
            });
        } else {
            console.warn('Estructura de respuesta inesperada:', response.data);
        }

        return solicitudesFinales;

    } catch (error) {
        console.error(" Error al obtener solicitudes físicas:", error);
        throw error;
    }
}

export interface MedidorDesconexion {
    Id_Solicitud: number;
    Id_Medidor: number;
    Numero_Medidor: number | string;
    [key: string]: any;
}

export async function getMedidoresDesconexionFisicas(): Promise<MedidorDesconexion[]> {
    const response = await apiAuth.get('/solicitudes-fisicas/desconexion/medidores');
    return Array.isArray(response.data) ? response.data : [];
}

export async function getSolicitudesPorEstado(estado: string): Promise<SolicitudFisica[]> {
    try {
        const todasLasSolicitudes = await getSolicitudesFisicas();
        return todasLasSolicitudes.filter(solicitud => solicitud.Estado.Nombre_Estado === estado);
    } catch (error) {
        console.error(` Error al obtener solicitudes físicas por estado ${estado}:`, error);
        throw error;
    }
}

export async function getSolicitudesPendientes(): Promise<SolicitudFisica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-fisicas/pendientes");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes físicas pendientes:', error);
        throw error;
    }
}

export async function getSolicitudesPorTipo(tipo: SolicitudFisicaBase['Tipo_Solicitud']): Promise<SolicitudFisica[]> {
    try {
        const response = await apiAuth.get(`/solicitudes-fisicas/tipo/${tipo}`);
        return response.data;
    } catch (error) {
        console.error(` Error al obtener solicitudes físicas por tipo ${tipo}:`, error);
        throw error;
    }
}

export async function getSolicitudesAfiliacion(): Promise<SolicitudAfiliacionFisica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-fisicas/afiliacion");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de afiliación físicas:', error);
        throw error;
    }
}

export async function getSolicitudesDesconexion(): Promise<SolicitudDesconexionFisica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-fisicas/desconexion");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de desconexión físicas:', error);
        throw error;
    }
}

export async function getSolicitudesCambioMedidor(): Promise<SolicitudCambioMedidorFisica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-fisicas/cambio-medidor");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de cambio de medidor físicas:', error);
        throw error;
    }
}

export async function getSolicitudesAsociado(): Promise<SolicitudAsociadoFisica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-fisicas/asociado");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de asociado físicas:', error);
        throw error;
    }
}

export async function getSolicitudesAgregarMedidorFisicas(): Promise<SolicitudAgregarMedidorFisica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-fisicas/agregar-medidor");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de agregar medidor físicas:', error);
        throw error;
    }
}

export async function getSolicitudAgregarMedidorFisicaById(id: number): Promise<SolicitudAgregarMedidorFisica> {
    try {
        const response = await apiAuth.get(`/solicitudes-fisicas/agregar-medidor/${id}`);
        return response.data;
    } catch (error) {
        console.error(` Error al obtener solicitud de agregar medidor física #${id}:`, error);
        throw error;
    }
}

export async function createSolicitudAgregarMedidorFisica(
    data: CreateSolicitudAgregarMedidorFisicaDTO
): Promise<SolicitudAgregarMedidorFisica> {
    try {
        const formData = new FormData();

        formData.append('Tipo_Identificacion', data.Tipo_Identificacion);
        formData.append('Identificacion', data.Identificacion);
        formData.append('Nombre', data.Nombre);
        formData.append('Apellido1', data.Apellido1);
        if (data.Apellido2) formData.append('Apellido2', data.Apellido2);
        formData.append('Correo', data.Correo);
        formData.append('Numero_Telefono', data.Numero_Telefono);
        formData.append('Direccion_Exacta', data.Direccion_Exacta);
        formData.append('Planos_Terreno', data.Planos_Terreno);
        formData.append('Certificacion_Literal', data.Certificacion_Literal);
        if (data.Id_Nuevo_Medidor != null) {
            formData.append('Id_Nuevo_Medidor', String(data.Id_Nuevo_Medidor));
        }

        const response = await apiAuth.post("/solicitudes-fisicas/create/agregar-medidor", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error(' Error al crear solicitud de agregar medidor física:', error);
        throw error;
    }
}

export async function updateSolicitudAgregarMedidorFisica(
    id: number,
    idUsuario: number,
    data: Partial<SolicitudAgregarMedidorFisica>
): Promise<SolicitudAgregarMedidorFisica> {
    try {
        const response = await apiAuth.put(
            `/solicitudes-fisicas/update/agregar-medidor/${id}?idUsuario=${idUsuario}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(` Error al actualizar solicitud de agregar medidor física #${id}:`, error);
        throw error;
    }
}

export async function cambiarEstadoAgregarMedidorFisica(
    idSolicitud: number,
    idEstado: number,
    idUsuario: number
): Promise<void> {
    try {
        await apiAuth.patch(
            `/solicitudes-fisicas/update/estado/agregar-medidor/${idSolicitud}/${idEstado}?idUsuario=${idUsuario}`
        );
    } catch (error) {
        console.error(` Error al cambiar estado de agregar medidor física #${idSolicitud}:`, error);
        throw error;
    }
}

export async function createSolicitudAsociadoFisica(
    data: CreateSolicitudAsociadoFisicaDTO
): Promise<SolicitudAsociadoFisica> {
    try {
        const formData = new FormData();

        formData.append('Tipo_Identificacion', data.Tipo_Identificacion);
        formData.append('Identificacion', data.Identificacion);
        formData.append('Nombre', data.Nombre);
        formData.append('Apellido1', data.Apellido1);
        if (data.Apellido2) formData.append('Apellido2', data.Apellido2);
        formData.append('Correo', data.Correo);
        formData.append('Numero_Telefono', data.Numero_Telefono);
        formData.append('Direccion_Exacta', data.Direccion_Exacta);
        if (data.Motivo_Solicitud) formData.append('Motivo_Solicitud', data.Motivo_Solicitud);
        formData.append('Planos_Terreno', data.Planos_Terreno);
        formData.append('Escrituras_Terreno', data.Escrituras_Terreno);

        const response = await apiAuth.post('/solicitudes-fisicas/create/asociado', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error(' Error al crear solicitud de asociado física:', error);
        throw error;
    }
}

export async function updateSolicitudFisicaByTipo(
    id: number,
    tipoSolicitud: string,
    data: Record<string, unknown>
): Promise<SolicitudFisica> {
    try {
        const tipoSolicitudSlug = toTipoSolicitudSlug(tipoSolicitud);
        const response = await apiAuth.put(
            `/solicitudes-fisicas/update/${tipoSolicitudSlug}/${id}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(` Error al actualizar solicitud física #${id}:`, error);
        throw error;
    }
}