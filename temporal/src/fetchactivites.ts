import baseDataJson from "../../data/boverket_stockholm_100.json";
import { Property } from "./types/property";

/**
 * Fetch base property data for a specific street
 * @param streetName - the street to filter properties on
 * @returns filtered properties
 */
export async function fetchBaseData(streetName: string): Promise<Property[]> {
  console.log(`Fetching base data for street: ${streetName}`);

  const filteredProperties: Property[] = baseData.filter(
    (property: Property) =>
      property.streetAddress.toLowerCase() === streetName.toLowerCase()
  );

  return filteredProperties;
}
