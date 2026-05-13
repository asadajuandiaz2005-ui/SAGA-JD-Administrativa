import z from 'zod';

export const UpdateMaterialSchema = z.object({
  Nombre_Material: z.string()
    .min(2, "El nombre del material debe tener al menos 2 caracteres")
    .max(50, "El nombre del material no puede tener más de 50 caracteres")
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s!?¿¡().,-]+$/, "El nombre solo puede contener letras, números, espacios y los caracteres !?¿¡().,-"),
  
  Descripcion: z.string()
    .max(200, "La descripción no puede tener más de 200 caracteres")
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s!?¿¡().,-]*$/, "La descripción solo puede contener letras, números, espacios y los caracteres !?¿¡().,-")
    .optional(),
    
  Id_Unidad_Medicion: z.number()
    .min(1, "Debe seleccionar una unidad de medición")
    .max(100, "La unidad de medición seleccionada no es válida")
    .int("La unidad de medición debe ser un número entero"),
  
  Precio_Unitario: z.number()
    .min(5, "El precio unitario debe ser al menos 5")
    .max(10000000, "El precio unitario no puede ser mayor a 10,000,000")
    .refine(value => /^\d+(\.\d{1,2})?$/.test(value.toString()), "El precio unitario debe tener como máximo 2 decimales"),
  
  Numero_Estanteria: z.number({
    required_error: "El número de estantería es requerido",
    invalid_type_error: "El número de estantería debe ser un número"
  })
    .min(1, "El número de estantería debe ser al menos 1")
    .max(50, "El número de estantería no puede ser mayor a 50")
    .int("El número de estantería debe ser un número entero"),
  IDS_Categorias: z.array(z.number())
    .optional()
});

export type UpdateMaterialSchemaData = z.infer<typeof UpdateMaterialSchema>;