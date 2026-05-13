import apiAuth from "@/Api/apiAuth";
import type { AfiliadoJuridico } from "../Models/TablaAfiliados/ModeloAfiliadoJuridico";

export async function getAfiliadosJuridicos(): Promise<AfiliadoJuridico[]> {
    const response = await apiAuth.get<AfiliadoJuridico[]>("/afiliados/juridico/all");
    return response.data;
}

export async function getAfiliadoJuridicoById(id: number): Promise<AfiliadoJuridico> {
    const response = await apiAuth.get<AfiliadoJuridico>(`/afiliados/juridico/${id}`);
    return response.data;
}

export async function getAfiliadoJuridicoDetail(id: number): Promise<AfiliadoJuridico> {
    const response = await apiAuth.get<AfiliadoJuridico>(`/afiliados/juridico/detail/${id}`);
    return response.data;
}

export const createAfiliadoJuridico = async (formData: FormData) => {

    const response = await apiAuth.post("/afiliados/juridico/create", formData, {
        headers: {
            'Content-Type': 'multipart/form-data', 
        },
    });

    return response.data;
};

export const updateAfiliadoJuridico = async (cedulaJuridica: string, formData: FormData) => {

    const response = await apiAuth.put(`/afiliados/update/juridico/${cedulaJuridica}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const updateEstadoAfiliadoJuridico = async (id: string, nuevoEstadoId: number) => {
    const response = await apiAuth.patch(`/afiliados/juridico/${id}/update/estado/${nuevoEstadoId}`);
    return response.data;
};

export const updateTipoAfiliadoJuridico = async (
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
        `/afiliados/update/tipo/juridico/${id}/tipo/${nuevoTipoId}`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};

export async function getAfiliadoJuridicoByIdentificacion(cedulaJuridica: string): Promise<{
    Id_Afiliado: number;
    Cedula_Juridica: string;
    Razon_Social: string;
    Correo: string;
    Numero_Telefono: string;
    Direccion_Exacta: string;
}> {
    const response = await apiAuth.get(`/afiliados/juridico/info/${cedulaJuridica}`);
    return response.data;
}

export const asignarMedidorExistenteAfiliadoJuridico = async (
    idAfiliado: number,
    idMedidor: number,
    certificacionLiteral: File,
    planosTerreno: File,
    estadoPago?: 'Pagado' | 'Pendiente'
): Promise<void> => {
    const formData = new FormData();
    formData.append('Id_Afiliado', String(idAfiliado));
    formData.append('Id_Medidor', String(idMedidor));
    formData.append('Certificacion_Literal', certificacionLiteral);
    formData.append('Planos_Terreno', planosTerreno);
    if (estadoPago) {
        formData.append('Estado_Pago', estadoPago);
    }

    await apiAuth.post('/Inventario/asignar/medidor/afiliado', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const crearYAsignarMedidorAfiliadoJuridico = async (
    idAfiliado: number,
    numeroMedidor: number,
    certificacionLiteral: File,
    planosTerreno: File,
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
    formData.append('Certificacion_Literal', certificacionLiteral);
    formData.append('Planos_Terreno', planosTerreno);
    if (estadoPago) {
        formData.append('Estado_Pago', estadoPago);
    }

    await apiAuth.post('/Inventario/asignar/medidor/afiliado', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};