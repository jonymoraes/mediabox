export type MultipartFile = {
  filename: string;
  mimetype: string;
  encoding: string;
  fieldname: string;
  toBuffer: () => Promise<Buffer>;
};

export type MultipartField = {
  value: string;
  fieldname: string;
  mimetype: string;
  encoding: string;
};

export type UploadBody = {
  file: MultipartFile;
  context?: MultipartField;
  format?: MultipartField;
};
