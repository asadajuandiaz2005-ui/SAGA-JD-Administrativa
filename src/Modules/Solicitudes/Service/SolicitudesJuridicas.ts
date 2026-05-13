import apiAuth from "@/Api/apiAuth";
import type {
    SolicitudJuridica,
    SolicitudJuridicaBase,
    SolicitudAfiliacionJuridica,
    SolicitudDesconexionJuridica,
    SolicitudCambioMedidorJuridica,
    SolicitudAsociadoJuridica,
    SolicitudAgregarMedidorJuridica,
    CreateSolicitudAgregarMedidorJuridicaDTO,
    CreateSolicitudAsociadoJuridicaDTO
} from "../Models/ModelosJuridicos";
import { toTipoSolicitudSlug } from "../utils/tipoSolicitud";

export async function getSolicitudesJuridicas(): Promise<SolicitudJuridica[]> {
    try {
        let response;

        try {
            response = await apiAuth.get("/solicitudes-juridicas/all");
        } catch (error) {
            console.error("Error al obtener solicitudes jurídicas:", error);
            throw error;
        }

        let solicitudesFinales: SolicitudJuridica[] = [];

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
        console.error(" Error al obtener solicitudes jurídicas:", error);
        throw error;
    }
}

export interface MedidorDesconexion {
    Id_Solicitud: number;
    Id_Medidor: number;
    Numero_Medidor: number | string;
    [key: string]: any;
}

export async function getMedidoresDesconexionJuridicas(): Promise<MedidorDesconexion[]> {
    const response = await apiAuth.get('/solicitudes-juridicas/desconexion/medidores');
    return Array.isArray(response.data) ? response.data : [];
}

export async function getSolicitudesPorEstado(estado: string): Promise<SolicitudJuridica[]> {
    try {
        const todasLasSolicitudes = await getSolicitudesJuridicas();
        return todasLasSolicitudes.filter(solicitud => solicitud.Estado.Nombre_Estado === estado);
    } catch (error) {
        console.error(` Error al obtener solicitudes jurídicas por estado ${estado}:`, error);
        throw error;
    }
}

export async function getSolicitudesPendientes(): Promise<SolicitudJuridica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-juridicas/pendientes");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes jurídicas pendientes:', error);
        throw error;
    }
}

export async function getSolicitudesPorTipo(tipo: SolicitudJuridicaBase['Tipo_Solicitud']): Promise<SolicitudJuridica[]> {
    try {
        const response = await apiAuth.get(`/solicitudes-juridicas/tipo/${tipo}`);
        return response.data;
    } catch (error) {
        console.error(` Error al obtener solicitudes jurídicas por tipo ${tipo}:`, error);
        throw error;
    }
}

export async function getSolicitudesAfiliacion(): Promise<SolicitudAfiliacionJuridica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-juridicas/afiliacion");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de afiliación jurídicas:', error);
        throw error;
    }
}

export async function getSolicitudesDesconexion(): Promise<SolicitudDesconexionJuridica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-juridicas/desconexion");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de desconexión jurídicas:', error);
        throw error;
    }
}

export async function getSolicitudesCambioMedidor(): Promise<SolicitudCambioMedidorJuridica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-juridicas/cambio-medidor");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de cambio de medidor jurídicas:', error);
        throw error;
    }
}

export async function getSolicitudesAsociado(): Promise<SolicitudAsociadoJuridica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-juridicas/asociado");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de asociado jurídicas:', error);
        throw error;
    }
}

export async function getSolicitudesAgregarMedidorJuridicas(): Promise<SolicitudAgregarMedidorJuridica[]> {
    try {
        const response = await apiAuth.get("/solicitudes-juridicas/agregar-medidor");
        return response.data;
    } catch (error) {
        console.error(' Error al obtener solicitudes de agregar medidor jurídicas:', error);
        throw error;
    }
}

export async function getSolicitudAgregarMedidorJuridicaById(id: number): Promise<SolicitudAgregarMedidorJuridica> {
    try {
        const response = await apiAuth.get(`/solicitudes-juridicas/agregar-medidor/${id}`);
        return response.data;
    } catch (error) {
        console.error(` Error al obtener solicitud de agregar medidor jurídica #${id}:`, error);
        throw error;
    }
}

export async function createSolicitudAgregarMedidorJuridica(
    data: CreateSolicitudAgregarMedidorJuridicaDTO
): Promise<SolicitudAgregarMedidorJuridica> {
    try {
        const formData = new FormData();

        formData.append('Cedula_Juridica', data.Cedula_Juridica);
        formData.append('Razon_Social', data.Razon_Social);
        formData.append('Correo', data.Correo);
        formData.append('Numero_Telefono', data.Numero_Telefono);
        formData.append('Direccion_Exacta', data.Direccion_Exacta);
        formData.append('Planos_Terreno', data.Planos_Terreno);
        formData.append('Certificacion_Literal', data.Certificacion_Literal);
        if (data.Id_Nuevo_Medidor != null) {
            formData.append('Id_Nuevo_Medidor', String(data.Id_Nuevo_Medidor));
        }

        const response = await apiAuth.post("/solicitudes-juridicas/create/agregar-medidor", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error(' Error al crear solicitud de agregar medidor jurídica:', error);
        throw error;
    }
}

export async function updateSolicitudAgregarMedidorJuridica(
    id: number,
    idUsuario: number,
    data: Partial<SolicitudAgregarMedidorJuridica>
): Promise<SolicitudAgregarMedidorJuridica> {
    try {
        const response = await apiAuth.put(
            `/solicitudes-juridicas/update/agregar-medidor/${id}?idUsuario=${idUsuario}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(` Error al actualizar solicitud de agregar medidor jurídica #${id}:`, error);
        throw error;
    }
}

export async function cambiarEstadoAgregarMedidorJuridica(
    idSolicitud: number,
    idEstado: number,
    idUsuario: number
): Promise<void> {
    try {
        await apiAuth.patch(
            `/solicitudes-juridicas/update/estado/agregar-medidor/${idSolicitud}/${idEstado}?idUsuario=${idUsuario}`
        );
    } catch (error) {
        console.error(` Error al cambiar estado de agregar medidor jurídica #${idSolicitud}:`, error);
        throw error;
    }
}

export async function createSolicitudAsociadoJuridica(
    data: CreateSolicitudAsociadoJuridicaDTO
): Promise<SolicitudAsociadoJuridica> {
    try {
        const formData = new FormData();

        formData.append('Cedula_Juridica', data.Cedula_Juridica);
        formData.append('Razon_Social', data.Razon_Social);
        formData.append('Correo', data.Correo);
        formData.append('Numero_Telefono', data.Numero_Telefono);
        formData.append('Direccion_Exacta', data.Direccion_Exacta);
        if (data.Motivo_Solicitud) formData.append('Motivo_Solicitud', data.Motivo_Solicitud);
        formData.append('Planos_Terreno', data.Planos_Terreno);
        formData.append('Escrituras_Terreno', data.Escrituras_Terreno);

        const response = await apiAuth.post('/solicitudes-juridicas/create/asociado', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error(' Error al crear solicitud de asociado jurídica:', error);
        throw error;
    }
}

export async function updateSolicitudJuridicaByTipo(
    id: number,
    tipoSolicitud: string,
    data: Record<string, unknown>
): Promise<SolicitudJuridica> {
    try {
        const tipoSolicitudSlug = toTipoSolicitudSlug(tipoSolicitud);

        const response = await apiAuth.put(
            `/solicitudes-juridicas/update/${tipoSolicitudSlug}/${id}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(` Error al actualizar solicitud jurídica #${id}:`, error);
        throw error;
    }
}