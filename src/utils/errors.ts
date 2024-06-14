export class MulterFilterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MulterFilterError";
  }
}
