const UNITS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

// a count in words, the way the pages write numbers in running text; 100 and over stay as digits
export function words(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return UNITS[n];
  const unit = n % 10;
  return unit ? `${TENS[Math.floor(n / 10)]}-${UNITS[unit]}` : TENS[n / 10];
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
