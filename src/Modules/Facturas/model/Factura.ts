// Match con FacturaGeneradaResponseDTO del backend
export interface Factura {
    Id_Factura: number;
    Numero_Factura: string;
    Afiliado: {
        Id_Afiliado: number;
        Identificacion?: string;
        Nombre_Completo?: string;
        Razon_Social?: string;
        Cedula_Juridica?: string;
    };
    Lectura: {
        Id_Lectura: number;
        Numero_Medidor: number;
        Fecha_Lectura: string;
        Valor_Lectura_Anterior: number;
        Valor_Lectura_Actual: number;
    };
    Consumo_M3: number;
    Cargo_Fijo: string;
    Cargo_Consumo: string;
    Cargo_Recurso_Hidrico: string;
    Otros_Cargos: string;
    Subtotal: string;
    Impuestos: string;
    Total: string;
    Fecha_Emision: string;
    Fecha_Vencimiento: string;
    Estado: {
        Id_Estado_Factura: number;
        Nombre_Estado: string;
    };
    Tipo_Tarifa_Aplicada?: string;
    Observaciones?: string;
}

export type EstadoFacturaNombre = 'Disponible' | 'Pendiente' | 'Pagada' | 'Anulada' | string;

export interface MarcarVencidasResponse {
    mensaje: string;
    facturas_actualizadas: number;
}
