// Format numbers in Indian locale and convert to words (INR)
export const formatINR = (num) =>
  Number(num || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const numToWordsUnder1000 = (n) => {
  let str = "";
  if (n > 99) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
    n = n % 100;
  }
  if (n > 19) {
    str += tens[Math.floor(n / 10)] + " ";
    n = n % 10;
  }
  if (n > 0) str += ones[n] + " ";
  return str.trim();
};

export const numberToINRWords = (num) => {
  num = Math.round(Number(num || 0));
  if (num === 0) return "Zero Rupees Only";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num / 100000) % 100);
  const thousand = Math.floor((num / 1000) % 100);
  const hundred = Math.floor(num % 1000);

  let words = "";
  if (crore) words += numToWordsUnder1000(crore) + " Crore ";
  if (lakh) words += numToWordsUnder1000(lakh) + " Lakh ";
  if (thousand) words += numToWordsUnder1000(thousand) + " Thousand ";
  if (hundred) words += numToWordsUnder1000(hundred) + " ";
  return (words + "Rupees Only").replace(/\s+/g, " ").trim();
};
