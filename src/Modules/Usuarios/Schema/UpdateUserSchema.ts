import z from "zod";

export const UpdateUserSchema = z.object({ 
  Nombre_Usuario: z.string().min(1, "El nombre de usuario es requerido").max(20),
  Correo_Electronico: z.string()
    .min(1, "El correo electrónico es requerido")
    .max(50)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El correo electrónico no es válido"),
  Id_Rol: z.number().min(1, "Seleccione un rol"),
});
export type UpdateUserSchemaData = z.infer<typeof UpdateUserSchema>;