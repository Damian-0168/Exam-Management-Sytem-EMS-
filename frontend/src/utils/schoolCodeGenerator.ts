/**
 * Generate a unique school code from school name
 * Format: First 3 letters + Random 4 digits
 * Example: "Springfield High School" -> "SPR4572"
 */
export const generateSchoolCode = (schoolName: string): string => {
  // Extract first 3 letters from school name
  const letters = schoolName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .substring(0, 3)
    .padEnd(3, 'X'); // Pad with X if less than 3 letters

  // Generate 4 random digits
  const digits = Math.floor(1000 + Math.random() * 9000);

  return `${letters}${digits}`;
};

/**
 * Validate school code format
 * Must be 3 uppercase letters + 4 digits
 */
export const isValidSchoolCode = (code: string): boolean => {
  return /^[A-Z]{3}\d{4}$/.test(code);
};
