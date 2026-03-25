import { MediaStatus } from '../value-objects/media-status.vo';

export interface ImageProps {
  id?: string;
  filename: string;
  mimetype: string;
  filesize: number;
  status: MediaStatus;
  expiresAt?: Date;
  accountId: string;
  quotaId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Image {
  private readonly _id?: string;
  private _filename: string;
  private _mimetype: string;
  private _filesize: number;
  private _status: MediaStatus;
  private _expiresAt?: Date;
  private readonly _accountId: string;
  private _quotaId?: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(props: ImageProps) {
    this._id = props.id;
    this._filename = props.filename;
    this._mimetype = props.mimetype;
    this._filesize = props.filesize;
    this._status = props.status;
    this._expiresAt = props.expiresAt;
    this._accountId = props.accountId;
    this._quotaId = props.quotaId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    filename: string;
    mimetype: string;
    filesize: number;
    accountId: string;
    status?: MediaStatus;
    expiresAt?: Date;
    quotaId?: string;
  }): Image {
    return new Image({
      ...props,
      status: props.status ?? MediaStatus.temporary(),
    });
  }

  public static load(props: ImageProps): Image {
    return new Image(props);
  }

  get id(): string | undefined {
    return this._id;
  }

  get filename(): string {
    return this._filename;
  }

  get status(): MediaStatus {
    return this._status;
  }

  get accountId(): string {
    return this._accountId;
  }

  public activate(): void {
    this._status = MediaStatus.active();
    this._expiresAt = undefined;
  }

  public unpack(): ImageProps {
    return {
      id: this._id,
      filename: this._filename,
      mimetype: this._mimetype,
      filesize: this._filesize,
      status: this._status,
      expiresAt: this._expiresAt,
      accountId: this._accountId,
      quotaId: this._quotaId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
