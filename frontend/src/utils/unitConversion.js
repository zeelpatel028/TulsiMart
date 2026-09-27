/**
 * Tulsi Mart Unit Conversion & Price Calculator Utility
 */

export const DEFAULT_UNIT_FACTORS = {
  kg: { base: 'g', factor: 1000 },
  g: { base: 'g', factor: 1 },
  mg: { base: 'g', factor: 0.001 },
  q: { base: 'g', factor: 100000 },
  t: { base: 'g', factor: 1000000 },
  L: { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  pcs: { base: 'pcs', factor: 1 },
  pc: { base: 'pcs', factor: 1 },
  pkt: { base: 'pkt', factor: 1 },
  pack: { base: 'pack', factor: 1 },
  box: { base: 'box', factor: 1 },
  btl: { base: 'btl', factor: 1 },
  can: { base: 'can', factor: 1 },
  jar: { base: 'jar', factor: 1 },
  pouch: { base: 'pouch', factor: 1 },
  bag: { base: 'bag', factor: 1 },
  bdl: { base: 'bdl', factor: 1 },
  dz: { base: 'pcs', factor: 12 },
  hdz: { base: 'pcs', factor: 6 },
  strip: { base: 'strip', factor: 1 },
  ctn: { base: 'ctn', factor: 1 },
  set: { base: 'set', factor: 1 },
  pr: { base: 'pr', factor: 1 },
  tray: { base: 'tray', factor: 1 },
  sachet: { base: 'sachet', factor: 1 },
  roll: { base: 'roll', factor: 1 },
  m: { base: 'm', factor: 1 },
  cm: { base: 'm', factor: 0.01 }
};

/**
 * Calculates conversion ratio from Product Unit to Selling Unit.
 * E.g., Product Unit = 'kg', Selling Unit = 'g' => ratio = 1000 (1 kg = 1000 g).
 * If product price per Product Unit is ₹50/kg, price per Selling Unit is ₹50 / 1000 = ₹0.05/g.
 */
export function getUnitConversionRatio(prodUnit, sellUnit) {
  if (!prodUnit || !sellUnit) return 1;

  let pShort = '';
  if (typeof prodUnit === 'object' && prodUnit !== null) {
    pShort = prodUnit.short_name || prodUnit.name || '';
  } else {
    pShort = String(prodUnit || '');
  }

  let sShort = '';
  if (typeof sellUnit === 'object' && sellUnit !== null) {
    sShort = sellUnit.short_name || sellUnit.name || '';
  } else {
    sShort = String(sellUnit || '');
  }

  pShort = String(pShort).toLowerCase().trim();
  sShort = String(sShort).toLowerCase().trim();

  if (!pShort || !sShort || pShort === sShort) return 1;

  const pFactor = (typeof prodUnit === 'object' && prodUnit && prodUnit.conversion_factor) 
    ? parseFloat(prodUnit.conversion_factor) 
    : (DEFAULT_UNIT_FACTORS[pShort]?.factor || 1);

  const sFactor = (typeof sellUnit === 'object' && sellUnit && sellUnit.conversion_factor) 
    ? parseFloat(sellUnit.conversion_factor) 
    : (DEFAULT_UNIT_FACTORS[sShort]?.factor || 1);

  const pBase = (typeof prodUnit === 'object' && prodUnit && prodUnit.base_unit) 
    ? String(prodUnit.base_unit).toLowerCase() 
    : (DEFAULT_UNIT_FACTORS[pShort]?.base || pShort);

  const sBase = (typeof sellUnit === 'object' && sellUnit && sellUnit.base_unit) 
    ? String(sellUnit.base_unit).toLowerCase() 
    : (DEFAULT_UNIT_FACTORS[sShort]?.base || sShort);

  if (pBase && sBase && pBase !== sBase) {
    // Incompatible base units (e.g., kg vs pcs)
    return 1;
  }

  return (pFactor > 0 && sFactor > 0) ? (pFactor / sFactor) : 1;
}

/**
 * Calculates price for a customer selling quantity.
 * @param {number} sellingPricePerProductUnit - Price per Product Unit (e.g. ₹50/kg)
 * @param {number} customerQty - Quantity in Selling Units (e.g. 200 g)
 * @param {object|string} prodUnit - Product Unit (e.g. 'kg')
 * @param {object|string} sellUnit - Selling Unit (e.g. 'g')
 */
export function calculateSellingUnitPrice(sellingPricePerProductUnit, customerQty, prodUnit, sellUnit) {
  const price = parseFloat(sellingPricePerProductUnit) || 0;
  const qty = parseFloat(customerQty) || 0;
  const ratio = getUnitConversionRatio(prodUnit, sellUnit);
  const pricePerSellingUnit = price / ratio;
  return qty * pricePerSellingUnit;
}
