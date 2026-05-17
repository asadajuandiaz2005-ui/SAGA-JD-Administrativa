import z from 'zod';

export const CreateUserSchema = z.object({
  Nombre_Usuario: z.string().min(1, "El nombre de usuario es requerido").max(20),
  Correo_Electronico: z.string()
    .min(1, "El correo electrónico es requerido")
    .max(50)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El correo electrónico no es válido"),
  Contraseña: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(20),
  confirmarPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(20),
  Id_Rol: z.number().min(1, "Seleccione un rol"),
}).superRefine((data, ctx) => {
  if (data.confirmarPassword !== data.Contraseña) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Las contraseñas no coinciden",
      path: ["confirmarPassword"],
    });
  }
});

export type CreateUserSchemaData = z.infer<typeof CreateUserSchema>;


