import * as yup from "yup";

const imageSchema = yup.object({
  mimetype: yup
    .string()
    .test("fileType", "El archivo debe ser una imagen", (value) =>
      value?.startsWith("image/")
    ),
  size: yup
    .number()
    .max(1024 * 1024 * 5, "El archivo es muy grande, máximo 5MB"),
});

export const createPostSchema = yup.object({
  title: yup.string().required(),
  content: yup.string().required(),
  images: yup.array().of(imageSchema).max(5, "Máximo 5 imágenes"),
});

export const updatePostSchema = createPostSchema.omit(["images"]);

export const updateImagesSchema = yup.object({
  images: yup
    .array()
    .of(imageSchema)
    .max(5, "Máximo 5 imágenes")
    .required("Se requiere al menos una imagen"),
});
