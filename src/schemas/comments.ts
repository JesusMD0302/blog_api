import * as yup from "yup";

export const createCommentSchema = yup.object({
  content: yup.string().required("El contenido del comentario es requerido"),
});
