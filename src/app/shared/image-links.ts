/**
 * Enlaces de imagen de las opciones (lado del cliente).
 *
 * Aquí solo se valida para dar mejores mensajes al organizador mientras
 * escribe. Quien manda de verdad es el servidor (`server/utils/imageLinks.js`),
 * que repite estas mismas reglas: la petición puede venir de cualquier sitio.
 */

/** Servicios que sirven la imagen directamente. Ampliar es añadir uno aquí. */
export const ALLOWED_IMAGE_HOSTS = ['i.postimg.cc', 'i.ibb.co'];

/** Tope por opción. No es una cuota: es que una tarjeta con treinta
 *  miniaturas no hay quien la lea. */
export const MAX_IMAGES_PER_OPTION = 10;

const MAX_URL_LENGTH = 500;

/** Lo que postimages entrega al copiar el bloque de una galería. */
const BBCODE_IMG = /\[img\]([^\[\]]+)\[\/img\]/gi;

/** Cualquier enlace suelto, para cuando pegan los directos sin formato. */
const BARE_URL = /https?:\/\/[^\s"'<>\[\]()]+/gi;

export interface ParsedImageLinks {
  /** Enlaces nuevos, ya validados y sin repetir. */
  urls: string[];
  /** Cuántos se descartaron por no ser un enlace directo válido. */
  rejected: number;
  /** Cuántos quedaron fuera por llegar al tope. */
  overflow: number;
}

/**
 * Devuelve la URL normalizada si es un enlace directo aceptable, o null.
 * Nunca lanza: cualquier cosa entra y sale como null.
 */
export function normalizeImageUrl(raw: string): string | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (!ALLOWED_IMAGE_HOSTS.includes(parsed.hostname.toLowerCase())) return null;

  return parsed.toString();
}

/**
 * Saca los enlaces de imagen de lo que sea que hayan pegado.
 *
 * Postimages da el bloque en BBCode, donde cada foto trae dos enlaces: el de
 * la página (`[url=...]`) y el directo (`[img]...[/img]`). Solo el segundo
 * sirve en un <img>, así que cuando hay BBCode se leen únicamente esos y el
 * de la página ni se cuenta como descartado — sería ruido, no un error del
 * organizador.
 *
 * @param existing enlaces que ya tiene la opción, para no repetirlos ni
 *                 pasarse del tope al pegar por segunda vez.
 */
export function parseImageLinks(raw: string, existing: string[] = []): ParsedImageLinks {
  const result: ParsedImageLinks = { urls: [], rejected: 0, overflow: 0 };
  if (!raw || !raw.trim()) return result;

  const bbcode = [...raw.matchAll(BBCODE_IMG)].map(m => m[1]);
  const candidates = bbcode.length > 0 ? bbcode : (raw.match(BARE_URL) || []);

  const seen = new Set(existing);
  let slots = MAX_IMAGES_PER_OPTION - existing.length;

  for (const candidate of candidates) {
    const url = normalizeImageUrl(candidate);

    if (!url) {
      result.rejected++;
      continue;
    }

    if (seen.has(url)) continue;

    if (slots <= 0) {
      result.overflow++;
      continue;
    }

    seen.add(url);
    result.urls.push(url);
    slots--;
  }

  return result;
}
