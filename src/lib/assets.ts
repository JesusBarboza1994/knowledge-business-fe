import { defaultUrlTransform } from "react-markdown";

/**
 * How an asset is addressed inside a note body. Never a storage URL: the reference is resolved
 * to a real URL only at render time, so the backend can re-check permissions on every request.
 */
export const ASSET_REF_PREFIX = "kb:asset/";

/** Returns the asset id when `url` is a `kb:asset/<id>` body reference, otherwise undefined. */
export function assetIdFromRef(url?: string): string | undefined {
  if (!url || !url.startsWith(ASSET_REF_PREFIX)) return undefined;
  const id = url.slice(ASSET_REF_PREFIX.length).split(/[?#]/, 1)[0];
  return /^[a-f0-9]{24}$/i.test(id) ? id : undefined;
}

/**
 * react-markdown drops any URL whose protocol is not http(s)/mailto/xmpp/irc, so a `kb:asset/<id>`
 * reference reaches the image renderer as an empty src — no error, no warning, just a broken
 * image. Let our own scheme through and keep the default sanitizer for everything else.
 */
export function assetUrlTransform(url: string): string {
  return assetIdFromRef(url) ? url : defaultUrlTransform(url);
}
