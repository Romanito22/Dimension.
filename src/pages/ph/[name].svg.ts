import type { APIRoute } from 'astro';
import { SPECS, placeholderKeys, encodeKey, decodeKey } from '../../lib/placeholder';

export function getStaticPaths() {
  return placeholderKeys().map((key) => ({ params: { name: encodeKey(key) } }));
}

export const GET: APIRoute = ({ params }) => {
  const spec = SPECS[decodeKey(params.name!)];
  return new Response(spec.render(), { headers: { 'Content-Type': 'image/svg+xml' } });
};
