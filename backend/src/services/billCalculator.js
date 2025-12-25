// services/billCalculator.js
export function calculateBill(items, vatPercent, serviceChargePercent, discountPercent) {
  let subtotal = 0;

  const computedItems = items.map(i => {
    const amount = i.quantity * i.rate;
    subtotal += amount;
    return { ...i, amount };
  });

  const vatAmount = subtotal * vatPercent / 100;
  const serviceChargeAmount = subtotal * serviceChargePercent / 100;

  const beforeDiscount = subtotal + vatAmount + serviceChargeAmount;
  const discountAmount = beforeDiscount * discountPercent / 100;

  const totalAmount = beforeDiscount - discountAmount;

  return {
    items: computedItems,
    subtotal,
    vatAmount,
    serviceChargeAmount,
    discountAmount,
    totalAmount,
    
  };
}
