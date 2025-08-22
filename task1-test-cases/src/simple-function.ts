/**
 * String Increment Function
 *
 * This function implements a string increment algorithm that takes strings in the format
 * A...A1...1 (1-4 letters followed by 1-4 digits) and increments the numeric postfix by 1.
 *
 * DESIGN CONSIDERATIONS:
 * - Case Handling: The function preserves the original case of input letters. While not
 *   explicitly specified in requirements, case normalization (e.g., converting to uppercase)
 *   could be added in the future to improve output consistency and readability, which is
 *   commonly expected in identifier systems.
 * - Whitespace Handling: The function does not trim whitespace from input strings, treating
 *   leading/trailing spaces as invalid characters. While not explicitly specified in
 *   requirements, automatic whitespace trimming could be added to improve user experience
 *   and handle common input variations more gracefully.
 *
 * @example
 * ```typescript
 * stringIncrement('FX001'); // Returns 'FX002'
 * stringIncrement('ZZ100'); // Returns 'ZZ101'
 * stringIncrement('A9');    // Returns 'A10'
 * stringIncrement('A9999'); // Returns 'A0000' (overflow resets to zeros)
 * stringIncrement('ABC');   // Returns 'Error' (invalid format)
 * stringIncrement('fx001'); // Returns 'fx002' (preserves original case)
 * ```
 *
 * @param input - String in format A...A1...1 where:
 *                - A can be any letter A-Z (case insensitive matching, preserves original case)
 *                - At least 1 letter, up to 4 letters maximum
 *                - 1 can be any digit 0-9
 *                - At least 1 digit, up to 4 digits maximum
 *
 * @returns The incremented string (preserving original case) or "Error" for invalid inputs
 *
 * Algorithm Specification:
 * - Valid input format: 1-4 letters followed by 1-4 digits
 * - Case insensitive input validation (preserves original case in output)
 * - Increments numeric postfix by 1
 * - On overflow (exceeds 4 digits), resets numeric postfix to all zeros
 * - Returns "Error" for any invalid input format
 *
 * Valid Examples:
 * - 'A1' → 'A2'
 * - 'FX001' → 'FX002'
 * - 'ZZ100' → 'ZZ101'
 * - 'ABCD9999' → 'ABCD0000' (overflow)
 * - 'abc123' → 'abc124' (case preserved)
 *
 * Invalid Examples (return "Error"):
 * - '123' (no letters)
 * - 'ABC' (no digits)
 * - 'ABCDE1' (too many letters)
 * - 'A12345' (too many digits)
 * - 'A1B2' (letters and digits mixed)
 * - 'A-1' (special characters)
 */
export function stringIncrement(input: string): string {
  // Input validation - check for null, undefined, or empty string
  if (!input || typeof input !== 'string') {
    return 'Error';
  }

  // Regular expression to match valid format: 1-4 letters followed by 1-4 digits (case insensitive)
  // No whitespace trimming - spaces are treated as invalid characters
  const validFormatRegex = /^([A-Za-z]{1,4})(\d{1,4})$/;
  const match = input.match(validFormatRegex);

  // Return error if format doesn't match
  if (!match || match.length < 3) {
    return 'Error';
  }

  const letterPart = match[1];
  const digitPart = match[2];

  // Parse the numeric part
  const currentNumber = parseInt(digitPart, 10);
  const incrementedNumber = currentNumber + 1;

  // Check for overflow - if incremented number would exceed 4 digits
  const incrementedStr = incrementedNumber.toString();

  let newDigitPart: string;
  if (incrementedStr.length > 4) {
    // Overflow: exceeds 4 digits, reset to all zeros with original digit length
    newDigitPart = '0'.repeat(digitPart.length);
  } else if (incrementedStr.length > digitPart.length) {
    // Number expanded but still within 4 digits, use the new length
    newDigitPart = incrementedStr;
  } else {
    // Normal increment: pad with leading zeros to maintain original length
    newDigitPart = incrementedStr.padStart(digitPart.length, '0');
  }

  // Combine letter part with new digit part
  return letterPart + newDigitPart;
}
