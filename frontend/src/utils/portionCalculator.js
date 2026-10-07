/**
 * Tulsi Mart Dynamic Portion & Cart Math Calculator Utility
 */

export const UNIT_TYPES = {
  WEIGHT: 'WEIGHT', // kg, g, mg, q, t
  VOLUME: 'VOLUME', // L, ml
  PIECE: 'PIECE',   // pc, pcs, pkt, pack, box, btl, jar, can, pouch, bag, bdl, ctn, set, tray, roll, sachet
  DOZEN: 'DOZEN',   // dz, hdz
};

/**
 * Map short unit names to unit types & base factors
 */
export function getUnitTypeInfo(unitShort) {
  const u = String(unitShort || 'pc').toLowerCase().trim();

  if (['kg', 'g', 'gram', 'grams', 'mg', 'q', 't'].includes(u)) {
    let baseUnit = 'kg';
    let baseFactorInGrams = 1000;
    if (u === 'g' || u === 'gram' || u === 'grams') {
      baseUnit = 'g';
      baseFactorInGrams = 1;
    } else if (u === 'mg') {
      baseUnit = 'mg';
      baseFactorInGrams = 0.001;
    } else if (u === 'q') {
      baseUnit = 'q';
      baseFactorInGrams = 100000;
    }
    return { type: UNIT_TYPES.WEIGHT, baseUnit, uShort: u, factorInGrams: baseFactorInGrams };
  }

  if (['l', 'litre', 'litres', 'ml'].includes(u)) {
    let baseUnit = 'L';
    let baseFactorInMl = 1000;
    if (u === 'ml') {
      baseUnit = 'ml';
      baseFactorInMl = 1;
    }
    return { type: UNIT_TYPES.VOLUME, baseUnit, uShort: u, factorInMl: baseFactorInMl };
  }

  if (['dz', 'hdz', 'dozen'].includes(u)) {
    return { type: UNIT_TYPES.DOZEN, baseUnit: 'dz', uShort: u, countPerDozen: u === 'hdz' ? 6 : 12 };
  }

  // Count/piece based units
  return { type: UNIT_TYPES.PIECE, baseUnit: u || 'pc', uShort: u || 'pc' };
}

/**
 * Generates dynamic quick weight/portion options based on configured unit
 */
export function getAvailablePortionOptions(unitShort) {
  const info = getUnitTypeInfo(unitShort);

  if (info.type === UNIT_TYPES.WEIGHT) {
    if (info.baseUnit === 'kg') {
      return [
        { label: '100g', value: '100g', ratio: 0.1, displayQty: '100g' },
        { label: '200g', value: '200g', ratio: 0.2, displayQty: '200g' },
        { label: '250g', value: '250g', ratio: 0.25, displayQty: '250g' },
        { label: '500g', value: '500g', ratio: 0.5, displayQty: '500g' },
        { label: '1kg', value: '1kg', ratio: 1.0, displayQty: '1kg' },
        { label: '1.5kg', value: '1.5kg', ratio: 1.5, displayQty: '1.5kg' },
        { label: '2kg', value: '2kg', ratio: 2.0, displayQty: '2kg' },
      ];
    } else if (info.baseUnit === 'g') {
      return [
        { label: '50g', value: '50g', ratio: 50, displayQty: '50g' },
        { label: '100g', value: '100g', ratio: 100, displayQty: '100g' },
        { label: '200g', value: '200g', ratio: 200, displayQty: '200g' },
        { label: '250g', value: '250g', ratio: 250, displayQty: '250g' },
        { label: '500g', value: '500g', ratio: 500, displayQty: '500g' },
        { label: '1000g', value: '1000g', ratio: 1000, displayQty: '1000g' },
      ];
    }
  }

  if (info.type === UNIT_TYPES.VOLUME) {
    if (info.baseUnit === 'L') {
      return [
        { label: '100ml', value: '100ml', ratio: 0.1, displayQty: '100ml' },
        { label: '200ml', value: '200ml', ratio: 0.2, displayQty: '200ml' },
        { label: '250ml', value: '250ml', ratio: 0.25, displayQty: '250ml' },
        { label: '500ml', value: '500ml', ratio: 0.5, displayQty: '500ml' },
        { label: '1L', value: '1L', ratio: 1.0, displayQty: '1L' },
        { label: '1.5L', value: '1.5L', ratio: 1.5, displayQty: '1.5L' },
        { label: '2L', value: '2L', ratio: 2.0, displayQty: '2L' },
      ];
    } else {
      return [
        { label: '100ml', value: '100ml', ratio: 100, displayQty: '100ml' },
        { label: '200ml', value: '200ml', ratio: 200, displayQty: '200ml' },
        { label: '250ml', value: '250ml', ratio: 250, displayQty: '250ml' },
        { label: '500ml', value: '500ml', ratio: 500, displayQty: '500ml' },
        { label: '1000ml', value: '1000ml', ratio: 1000, displayQty: '1000ml' },
      ];
    }
  }

  if (info.type === UNIT_TYPES.DOZEN) {
    return [
      { label: '1/2 dz (6 pcs)', value: '0.5dz', ratio: 0.5, displayQty: '6 pcs' },
      { label: '1 dz (12 pcs)', value: '1dz', ratio: 1.0, displayQty: '12 pcs' },
      { label: '2 dz (24 pcs)', value: '2dz', ratio: 2.0, displayQty: '24 pcs' },
    ];
  }

  // Piece-based default options
  const name = info.uShort || 'pc';
  const plural = name === 'pc' ? 'pcs' : (name.endsWith('s') ? name : `${name}s`);
  return [
    { label: `1 ${name}`, value: `1_${name}`, ratio: 1, displayQty: `1 ${name}` },
    { label: `2 ${plural}`, value: `2_${plural}`, ratio: 2, displayQty: `2 ${plural}` },
    { label: `3 ${plural}`, value: `3_${plural}`, ratio: 3, displayQty: `3 ${plural}` },
    { label: `5 ${plural}`, value: `5_${plural}`, ratio: 5, displayQty: `5 ${plural}` },
    { label: `10 ${plural}`, value: `10_${plural}`, ratio: 10, displayQty: `10 ${plural}` },
  ];
}

/**
 * Calculates portion ratio for custom input
 */
export function calculateCustomPortionRatio(customQtyNum, customUnitStr, baseUnitShort) {
  const qty = parseFloat(customQtyNum) || 0;
  if (qty <= 0) return 1;

  const info = getUnitTypeInfo(baseUnitShort);
  const customUnit = String(customUnitStr || '').toLowerCase().trim();

  if (info.type === UNIT_TYPES.WEIGHT) {
    if (info.baseUnit === 'kg') {
      if (customUnit === 'g' || customUnit === 'gram' || customUnit === 'grams') {
        return qty / 1000;
      } else if (customUnit === 'mg') {
        return qty / 1000000;
      }
      return qty; // assumed kg
    } else if (info.baseUnit === 'g') {
      if (customUnit === 'kg') {
        return qty * 1000;
      }
      return qty; // assumed g
    }
  }

  if (info.type === UNIT_TYPES.VOLUME) {
    if (info.baseUnit === 'L') {
      if (customUnit === 'ml') {
        return qty / 1000;
      }
      return qty;
    } else if (info.baseUnit === 'ml') {
      if (customUnit === 'l' || customUnit === 'litre') {
        return qty * 1000;
      }
      return qty;
    }
  }

  return qty;
}

/**
 * Primary Product Pricing & Cart Line Calculation Engine
 */
export function calculateCartItemPricing({
  basePrice = 0,
  baseUnit = 'kg',
  portionRatio = 1,
  portionLabel = '1 unit',
  cartQuantity = 1,
  gstPercent = 0,
}) {
  const safeBasePrice = parseFloat(basePrice) || 0;
  const safeQty = Math.max(1, parseInt(cartQuantity) || 1);
  const safeRatio = parseFloat(portionRatio) > 0 ? parseFloat(portionRatio) : 1;
  const safeGst = parseFloat(gstPercent) || 0;

  // Price for the selected portion (e.g. 200g of ₹1000/kg -> ₹200.00)
  const portionPrice = safeBasePrice * safeRatio;

  // Total for line = portionPrice * cartQuantity (e.g. ₹200.00 * 2 -> ₹400.00)
  const itemTotal = portionPrice * safeQty;

  // Extract GST breakdown (inclusive retail standard)
  let gstAmount = 0;
  let netBeforeTax = itemTotal;
  if (safeGst > 0) {
    netBeforeTax = itemTotal / (1 + safeGst / 100);
    gstAmount = itemTotal - netBeforeTax;
  }

  return {
    basePrice: safeBasePrice,
    baseUnit,
    portionRatio: safeRatio,
    portionLabel,
    portionPrice,
    cartQuantity: safeQty,
    itemTotal,
    gstPercent: safeGst,
    gstAmount,
    netBeforeTax,
  };
}

/**
 * Cart Summary Totals Calculation Engine
 */
export function calculateCartTotals(cartItems = [], discountAmount = 0) {
  const safeDiscount = parseFloat(discountAmount) || 0;

  let subtotal = 0;
  let totalTax = 0;
  let totalItemsCount = 0;

  cartItems.forEach((item) => {
    const product = item.product || item;
    const basePrice = parseFloat(item.basePrice || product.selling_price || product.price || item.unitPrice || 0);
    const baseUnit = product.unit_name || product.unit || item.productUnitShort || 'kg';
    const portionRatio = item.portionRatio || 1;
    const portionLabel = item.portionLabel || `1 ${baseUnit}`;
    const cartQty = item.cartQuantity || item.quantity || 1;
    const gst = item.gstPercent !== undefined ? item.gstPercent : (product.selling_gst_percent || product.gst_percent || 0);

    const pricing = calculateCartItemPricing({
      basePrice,
      baseUnit,
      portionRatio,
      portionLabel,
      cartQuantity: cartQty,
      gstPercent: gst,
    });

    subtotal += pricing.itemTotal;
    totalTax += pricing.gstAmount;
    totalItemsCount += pricing.cartQuantity;
  });

  const grandTotal = Math.max(0, subtotal - safeDiscount);

  return {
    subtotal,
    totalTax,
    discountAmount: safeDiscount,
    grandTotal,
    totalItemsCount,
  };
}
