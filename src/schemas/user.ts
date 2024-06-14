import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("El email ingresado no es valido")
    .required("El email es requerido"),
  password: yup
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      "La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial"
    )
    .required("La contraseña es requerida"),
});

export const registerSchema = loginSchema.clone().shape({
  username: yup
    .string()
    .required("El nombre de usuario es requerido")
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      "El nombre de usuario no puede contener caracteres especiales"
    ),
});

export const updateUserSchema = registerSchema
  .clone()
  .omit(["password", "email"]);
