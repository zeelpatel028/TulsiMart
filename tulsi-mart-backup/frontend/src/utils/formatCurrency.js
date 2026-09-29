export const formatCurrency = (amount, symbol = '₹') => {
  if (amount === null || amount === undefined || isNaN(amount)) return `${symbol}0.00`;
  const val = Number(amount);
  return `${symbol}${val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default formatCurrency;
