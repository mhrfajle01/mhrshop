// Utility for weight/volume fractions and reverse price-to-weight calculation

/**
 * Convert grams to kg fraction (e.g. 500 gm -> 0.5 kg)
 */
export const gmToKg = (gm) => {
  const g = parseFloat(gm) || 0;
  return Number((g / 1000).toFixed(4));
};

/**
 * Convert kg to grams
 */
export const kgToGm = (kg) => {
  const k = parseFloat(kg) || 0;
  return Math.round(k * 1000);
};

/**
 * Calculate weight in KG based on targeted money amount and unit price per KG
 * Example: 30 Tk sugar at 120 Tk/kg -> 30 / 120 = 0.25 kg (250 gm)
 */
export const calculateWeightByPrice = (targetMoney, pricePerKg) => {
  const money = parseFloat(targetMoney) || 0;
  const price = parseFloat(pricePerKg) || 0;
  if (price <= 0 || money <= 0) return { qtyKg: 0, weightGm: 0, total: 0 };
  
  const qtyKg = Number((money / price).toFixed(4));
  const weightGm = Math.round(qtyKg * 1000);
  return {
    qtyKg,
    weightGm,
    total: Math.round(qtyKg * price)
  };
};

/**
 * BD Standard fractions
 */
export const BD_FRACTIONS = [
  { label: "১০০ গ্রাম", gm: 100, kg: 0.1 },
  { label: "২৫০ গ্রাম (পোয়া)", gm: 250, kg: 0.25 },
  { label: "৫০০ গ্রাম (আধ কেজি)", gm: 500, kg: 0.5 },
  { label: "৭৫০ গ্রাম (তিন পোয়া)", gm: 750, kg: 0.75 },
  { label: "১ কেজি", gm: 1000, kg: 1.0 },
  { label: "২ কেজি", gm: 2000, kg: 2.0 },
  { label: "৫ কেজি", gm: 5000, kg: 5.0 }
];
