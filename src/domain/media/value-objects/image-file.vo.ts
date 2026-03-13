export class ImageFile {
  constructor(
    public readonly buffer: Buffer,
    public readonly filename: string,
    public readonly mimetype: string,
    public readonly size: number,
  ) {
    Object.freeze(this);
  }
}
