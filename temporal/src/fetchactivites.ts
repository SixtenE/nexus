import baseData from '../../data/boverket_stockholm_100.json'; // ← no assert
import { Property } from './types/property';

function normalizeStreet(s: string) {
  return s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function materializeCandidates(data: unknown): any[] {
  // Case 1: already an array of properties
  if (Array.isArray(data)) return data;

  // Case 2: object with energideklarationer -> fastigheter
  const d = data as any;
  if (d && Array.isArray(d.energideklarationer)) {
    return d.energideklarationer.flatMap((ed: any) =>
      Array.isArray(ed.fastigheter)
        ? ed.fastigheter.map((f: any) => ({
            ...f,
            // Ensure there is a streetAddress field
            streetAddress: f.streetAddress ?? f.adress ?? '',
          }))
        : []
    );
  }

  return [];
}

/**
 * Fetch base property data for a specific street
 * @param streetName - the street to filter properties on
 * @returns filtered properties
 */
export async function fetchBaseData(streetName: string): Promise<Property[]> {
  console.log(`Fetching base data for street: ${streetName}`);

  const candidates = materializeCandidates(baseData);
  const target = normalizeStreet(streetName);

  const filtered = candidates.filter(
    (p: any) =>
      typeof p.streetAddress === 'string' &&
      normalizeStreet(p.streetAddress) === target
  );

  // If your Property type needs more fields, map them here before casting.
  return filtered as Property[];
}