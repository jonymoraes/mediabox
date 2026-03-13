import * as shared from '../../../../i18n/es/shared.json';
import * as identity from '../../../../i18n/es/identity.json';
import * as media from '../../../../i18n/es/media.json';

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Leaves<T> = T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T]
  : '';

/**
 * Validates that domain exception keys exist in the JSON files.
 * This provides compile-time safety across all bounded contexts.
 */
export type Translation =
  | `shared.${Leaves<typeof shared>}`
  | `identity.${Leaves<typeof identity>}`
  | `media.${Leaves<typeof media>}`;
