// Calculate discount based on customer type and base discount
exports.calculateDiscount = (baseDiscount, customerType) => {
  let totalDiscount = baseDiscount || 0;
  
  // Apply additional discounts based on customer type
  switch (customerType) {
    case 'regular':
      totalDiscount += 5; // 5% extra for regular customers
      break;
    case 'bulk':
      totalDiscount += 10; // 10% extra for bulk customers
      break;
    case 'normal':
    default:
      // No additional discount for normal customers
      break;
  }
  
  // Ensure discount doesn't exceed 100%
  return Math.min(totalDiscount, 100);
};