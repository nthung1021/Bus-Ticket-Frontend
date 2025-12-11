// Function to format price to locale style
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export function getCurrencySymbol(): string {
  // Format the number 0 to get a string with the currency symbol
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  const formattedZero = formatter.format(0);

  // Use a regular expression to remove all digits and potential spaces/separators
  // This will leave only the currency symbol/name
  return formattedZero.replace(/[0-9\s.,]/g, "").trim();
}
