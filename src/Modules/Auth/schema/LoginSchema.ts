import z from 'zod';


export const LoginSchema = z.object({
  Nombre_Usuario: z.string().min(1, 'El usuario o correo es requerido'),
  Password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export type LoginData = z.infer<typeof LoginSchema>;