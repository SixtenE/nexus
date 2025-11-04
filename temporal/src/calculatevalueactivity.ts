// calculateValue.ts

export type PropertyDetails = {
  energiklass: string;
  primarenergital?: string;
  energiprestanda?: string;
  radonmatning?: string;
  ventilationskontroll?: string;
  byggnadsar: number;
  livingArea: number;
};

export type MarketData = {
  propertyPrice: number; // this property's sale price
  saleDate: string;
  streetSales: {
    amount: number;
    soldAt: string;
    livingArea: number;
    numberOfRooms: number;
  }[];
};

export type TechnicalData = {
  sfp_kw_per_m3s: number;
  proj_floede_ls?: number;
  uppm_floede_ls?: number;
  tilluft_filterklass?: string;
  franluft_filterklass?: string;
};

export type ValueInterval = {
  minValue: number;
  maxValue: number;
  confidence: number; // percentage
};

export async function calculateValue(input: {
  propertyDetails: PropertyDetails;
  marketData: MarketData;
  technicalData: TechnicalData;
}): Promise<ValueInterval> {
  const { propertyDetails, marketData, technicalData } = input;

  const currentYear = new Date().getFullYear();
  const propertyArea = propertyDetails.livingArea;

  // 1️⃣ Base price from this property's sale
  let basePrice = marketData.propertyPrice;

  // 2️⃣ Street average price per m²
  const streetPricesPerM2 = marketData.streetSales.map(
    (s) => s.amount / s.livingArea
  );
  const avgStreetPricePerM2 =
    streetPricesPerM2.reduce((sum, val) => sum + val, 0) /
    streetPricesPerM2.length;

  // Adjust property price towards street average
  const propertyPricePerM2 = basePrice / propertyArea;
  const adjustmentFactor = avgStreetPricePerM2 / propertyPricePerM2;
  basePrice *= adjustmentFactor;

  // 3️⃣ Energy class adjustment
  const energyFactor: Record<string, number> = {
    A: 1.05,
    B: 1.03,
    C: 1.0,
    D: 0.97,
    E: 0.95,
  };
  basePrice *= energyFactor[propertyDetails.energiklass] ?? 1;

  // 4️⃣ Building age adjustment
  const age = currentYear - propertyDetails.byggnadsar;
  if (age < 10) basePrice *= 1.05;
  else if (age > 40) basePrice *= 0.85;

  // 5️⃣ Technical system adjustment
  if (technicalData.sfp_kw_per_m3s && technicalData.sfp_kw_per_m3s > 2) {
    basePrice *= 0.95; // lower efficiency reduces value
  }

  // 6️⃣ Temporal adjustment using last sale date
  const lastSaleYear = new Date(marketData.saleDate).getFullYear();
  const yearsSinceSale = currentYear - lastSaleYear;
  const annualGrowthRate = 0.03; // 3% per year
  basePrice *= Math.pow(1 + annualGrowthRate, yearsSinceSale);

  // 7️⃣ Confidence interval based on number of comparables
  const comparablesCount = marketData.streetSales.length;
  const confidence = Math.min(0.9, 0.8 + 0.02 * comparablesCount); // more comparables = higher confidence
  const minValue = basePrice * (1 - (1 - confidence) / 2);
  const maxValue = basePrice * (1 + (1 - confidence) / 2);

  return {
    minValue,
    maxValue,
    confidence: confidence * 100,
  };
}
