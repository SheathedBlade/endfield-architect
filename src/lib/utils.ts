/**
 * Calculates production rate per min
 * @param itemAmount # of items produced per craft
 * @param craftingTime # Amount of time to craft once
 */
export const calculateRate = (
  itemAmount: number,
  craftingTime: number,
): number => {
  return (itemAmount * 60) / craftingTime;
};
