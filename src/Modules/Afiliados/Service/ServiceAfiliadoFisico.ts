import apiAuth from "@/Api/apiAuth";
import type { AfiliadoFisico, Medidor } from "../Models/TablaAfiliados/ModeloAfiliadoFisico";

export async function getAfiliadosFisicos(): Promise<AfiliadoFisico[]> {
    const response = await apiAuth.get<AfiliadoFisico[]>("/afiliados/fisico/all");
    return response.data;
}

export async function getAfiliadoFisicoById(id: number): Promise<AfiliadoFisico> {
    const response = await apiAuth.get<AfiliadoFisico>(`/afiliados/fisico/${id}`);
    return response.data;
}

export async function getAfiliadoFisicoDetail(id: number): Promise<AfiliadoFisico> {
    const response = await apiAuth.get<AfiliadoFisico>(`/afiliados/fisico/detail/${id}`);
    return response.data;
}

// En tu Hook o Service
export const createAfiliadoFisico = async (formData: FormData) => {
    const response = await apiAuth.post("/afiliados/fisico/create", formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // ✅ Importante
        },
    });

    return response.data;
};

export const updateAfiliadoFisico = async (cedula: string, formData: FormData) => {
    const response = await apiAuth.put(`/afiliados/update/fisico/${cedula}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const updateEstadoAfiliadoFisico = async (id: string, nuevoEstadoId: number) => {
    const response = await apiAuth.patch(`/afiliados/fisico/${id}/update/estado/${nuevoEstadoId}`);
    return response.data;
};

export interface MedidorAsignable {
    Id_Medidor: number;
    Numero_Medidor: number;
    Estado_Medidor: {
        Id_Estado_Medidor: number;
        Nombre_Estado_Medidor: string;
    };
}

export const getMedidoresAsignables = async (): Promise<MedidorAsignable[]> => {
    const response = await apiAuth.get<MedidorAsignable[]>('/Inventario/medidores/asignables');
    return response.data;
};

// Tipo de medidor tal como lo devuelve el backend en el detalle
type MedidorBackend = {
    Id_Medidor: number;
    Numero_Medidor: number;
    Estado?: { Id_Estado: number; Nombre_Estado: string };
    Estado_Medidor?: { Id_Estado_Medidor: number; Nombre_Estado_Medidor: string };
    Estado_Pago?: string | { Id_Estado_Pago?: number; Nombre_Estado_Pago: string } | null;
    Certificacion_Literal?: string | null;
    Planos_Terreno?: string | null;
    Escrituras_Terreno?: string | null;
};

// Mapea la respuesta del backend al formato del frontend
const mapearMedidoresDetalle = (medidores: MedidorBackend[]): Medidor[] =>
    medidores.map((m) => ({
        Id_Medidor: m.Id_Medidor,
        Numero_Medidor: m.Numero_Medidor,
        Estado_Medidor: m.Estado_Medidor ?? (m.Estado ? {
            Id_Estado_Medidor: m.Estado.Id_Estado,
            Nombre_Estado_Medidor: m.Estado.Nombre_Estado,
        } : undefined),
        Estado_Pago: m.Estado_Pago ?? null,
        Certificacion_Literal: m.Certificacion_Literal ?? null,
        Planos_Terreno: m.Planos_Terreno ?? null,
        Escrituras_Terreno: m.Escrituras_Terreno ?? null,
    }));

export const getMedidoresByAfiliado = async (idAfiliado: number): Promise<Medidor[]> => {
    const response = await apiAuth.get(`/afiliados/fisico/detail/${idAfiliado}`);
    const data = response.data as { Medidores?: MedidorBackend[] };
    return mapearMedidoresDetalle(data.Medidores ?? []);
};

export const getMedidoresByAfiliadoJuridico = async (idAfiliado: number): Promise<Medidor[]> => {
    const response = await apiAuth.get(`/afiliados/juridico/detail/${idAfiliado}`);
    const data = response.data as { Medidores?: MedidorBackend[] };
    return mapearMedidoresDetalle(data.Medidores ?? []);
};

export const asignarMedidorAAfiliado = async (idAfiliado: number, idMedidor: number): Promise<void> => {
    await apiAuth.patch(`/afiliados/${idAfiliado}/medidores/${idMedidor}/asignar`);
};

export const asignarMedidorExistenteAfiliado = async (
    idAfiliado: number,
    idMedidor: number,
    certificacionLiteral: File | null,
    planosTerreno: File | null,
    estadoPago?: 'Pagado' | 'Pendiente'
): Promise<void> => {
    const formData = new FormData();
    formData.append('Id_Afiliado', String(idAfiliado));
    formData.append('Id_Medidor', String(idMedidor));
    if (certificacionLiteral) formData.append('Certificacion_Literal', certificacionLiteral);
    if (planosTerreno) formData.append('Planos_Terreno', planosTerreno);
    if (estadoPago) {
        formData.append('Estado_Pago', estadoPago);
    }

    await apiAuth.post('/Inventario/asignar/medidor/afiliado', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const crearYAsignarMedidorAfiliado = async (
    idAfiliado: number,
    numeroMedidor: number,
    certificacionLiteral: File | null,
    planosTerreno: File | null,
    estadoPago?: 'Pagado' | 'Pendiente'
): Promise<void> => {
    const medidorCreado = await apiAuth.post('/Inventario/create/medidor/', {
        Numero_Medidor: numeroMedidor,
    });

    const idMedidor = medidorCreado?.data?.Id_Medidor;
    if (!idMedidor) {
        throw new Error('No se pudo obtener el Id_Medidor del medidor creado.');
    }

    const formData = new FormData();
    formData.append('Id_Afiliado', String(idAfiliado));
    formData.append('Id_Medidor', String(idMedidor));
    if (certificacionLiteral) formData.append('Certificacion_Literal', certificacionLiteral);
    if (planosTerreno) formData.append('Planos_Terreno', planosTerreno);
    if (estadoPago) {
        formData.append('Estado_Pago', estadoPago);
    }

    await apiAuth.post('/Inventario/asignar/medidor/afiliado', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const subirArchivosMedidorAfiliado = async (
    idMedidor: number,
    certificacionFile: File | null,
    planosFile: File | null
): Promise<void> => {
    const formData = new FormData();
    if (certificacionFile) formData.append('Certificacion_Literal', certificacionFile);
    if (planosFile) formData.append('Planos_Terreno', planosFile);
    await apiAuth.post(`/afiliados/medidores/${idMedidor}/archivos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export async function getAfiliadoFisicoByIdentificacion(identificacion: string | number): Promise<{
    Id_Afiliado: number;
    Tipo_Identificacion: string;
    Identificacion: string;
    Nombre: string;
    Apellido1: string;
    Apellido2: string;
    Correo: string;
    Numero_Telefono: string;
    Direccion_Exacta: string;
}> {
    const response = await apiAuth.get(`/afiliados/fisico/info/${identificacion}`);
    return response.data;
}

export const updateTipoAfiliadoFisico = async (
    id: number,
    nuevoTipoId: number,
    archivos?: {
        Planos_Terreno?: File;
        Escrituras_Terreno?: File;
    }
) => {
    const formData = new FormData();

    if (archivos?.Planos_Terreno) {
        formData.append('Planos_Terreno', archivos.Planos_Terreno);
    }

    if (archivos?.Escrituras_Terreno) {
        formData.append('Escrituras_Terreno', archivos.Escrituras_Terreno);
    }

    const response = await apiAuth.patch(
        `/afiliados/update/tipo/fisico/${id}/tipo/${nuevoTipoId}`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};