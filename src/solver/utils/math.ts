/**
 * Calculates production rate per min
 * @param outputAmount # of items produced per craft
 * @param craftingTime # Amount of time to craft once
 */
export const calculateRate = (
  outputAmount: number,
  craftingTime: number,
): number => {
  return (outputAmount * 60) / craftingTime;
};

/**
 * Exact (fractional) number of facilities needed to hit target rate.
 * Does NOT ceil — use placedFacilitiesNeeded() for grid placement.
 */
export const exactFacilitiesNeeded = (
  targetRate: number,
  outputAmount: number,
  craftingTime: number,
): number => {
  const ratePerFacility = calculateRate(outputAmount, craftingTime);
  return targetRate / ratePerFacility;
};

/**
 * Number of facilities to place on grid (always whole machines).
 */
export const placedFacilitiesNeeded = (exactCount: number): number => {
  return Math.ceil(exactCount);
};

/**
 * Calculates the number of facilities needed to reach target rate, rounded up
 * @param targetRate
 * @param outputAmount
 * @param craftingTime
 */
export const facilitiesNeeded = (
  targetRate: number,
  outputAmount: number,
  craftingTime: number,
): number => {
  const ratePerFacility = calculateRate(outputAmount, craftingTime);
  return Math.ceil(targetRate / ratePerFacility);
};

/**
 * Gets actual rate with given facilities
 * @param facilityCount
 * @param outputAmount
 * @param craftingTime
 */
export function actualOutputRate(
  facilityCount: number,
  outputAmount: number,
  craftingTime: number,
): number {
  return facilityCount * calculateRate(outputAmount, craftingTime);
}

/**
 * Computes utilization fraction (0–1) from exact and placed counts.
 */
export const utilizationRate = (
  exactCount: number,
  placedCount: number,
): number => {
  if (placedCount <= 0) return NaN;
  return exactCount / placedCount;
};

/**
 * Computes overproduction rate: actual output minus required output.
 */
export const overproductionRate = (
  placedCount: number,
  outputAmount: number,
  craftingTime: number,
  targetRate: number,
): number => {
  const actual = actualOutputRate(placedCount, outputAmount, craftingTime);
  return actual - targetRate;
};

/**
 * Calculates input rate required given an input/output item ratio
 * @param targetOutputRate
 * @param inputAmount
 * @param outputAmount
 */
export const requiredInputRate = (
  targetOutputRate: number,
  inputAmount: number,
  outputAmount: number,
): number => {
  return (inputAmount / outputAmount) * targetOutputRate;
};
