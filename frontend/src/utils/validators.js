export const isValidPhone = (phone) => {
  if (!phone) return false;
  const re = /^[6-9]\d{9}$/;
  return re.test(String(phone).trim());
};

export const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export default { isValidPhone, isValidEmail };
