import { z } from 'zod';

export const CreateMedidorSchema = z.object({
  Numero_Medidor: z
    .number({
      required_error: 'El número del medidor es requerido',
      invalid_type_error: 'El número del medidor debe ser un número',
    })
    .int('El número del medidor debe ser un número entero')
    .min(1, 'El número del medidor debe tener al menos 1 dígito')
    .max(999999, 'El número del medidor no puede tener más de 6 dígitos'),
});

export const UpdateEstadoMedidorSchema = z.object({
  Id_Estado_Medidor: z
    .number({
      required_error: 'El estado del medidor es requerido',
    })
    .int()
    .min(1, 'Debe seleccionar un estado válido')
    .max(3, 'Debe seleccionar un estado válido'),
});

export type CreateMedidorSchemaData = z.infer<typeof CreateMedidorSchema>;
export type UpdateEstadoMedidorSchemaData = z.infer<typeof UpdateEstadoMedidorSchema>;