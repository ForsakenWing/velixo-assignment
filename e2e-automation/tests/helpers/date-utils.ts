import { DateValidationResult } from './types';

/**
 * Utility functions for date validation and comparison
 */
export class DateUtils {
  /**
   * Compare two dates and return validation result
   */
  static validateTodayFunction(actualValue: string): DateValidationResult {
    try {
      const today = new Date();
      const expectedDate = today.toLocaleDateString();
      
      // Clean the actual value
      const cleanValue = actualValue.trim();
      
      // Try multiple date parsing approaches
      let parsedDate: Date | null = null;
      
      // Approach 1: Direct parsing
      parsedDate = new Date(cleanValue);
      
      // Approach 2: If direct parsing fails, try common Excel date formats
      if (isNaN(parsedDate.getTime())) {
        // Try MM/DD/YYYY format
        const mmddyyyy = cleanValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyy) {
          parsedDate = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
        }
        
        // Try DD/MM/YYYY format
        if (isNaN(parsedDate.getTime())) {
          const ddmmyyyy = cleanValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (ddmmyyyy) {
            parsedDate = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
          }
        }
        
        // Try YYYY-MM-DD format
        if (isNaN(parsedDate.getTime())) {
          const yyyymmdd = cleanValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (yyyymmdd) {
            parsedDate = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
          }
        }
      }
      
      // Check if parsing was successful
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return {
          isValid: false,
          expectedDate,
          actualDate: cleanValue,
          message: `Unable to parse date: ${cleanValue}`
        };
      }
      
      // Compare dates (ignore time component)
      const isToday = this.isSameDate(parsedDate, today);
      
      return {
        isValid: isToday,
        expectedDate,
        actualDate: cleanValue,
        message: isToday 
          ? 'TODAY() function returned correct current date' 
          : `Date mismatch: expected ${expectedDate}, got ${cleanValue}`
      };
    } catch (error) {
      return {
        isValid: false,
        expectedDate: new Date().toLocaleDateString(),
        actualDate: actualValue,
        message: `Date validation error: ${error}`
      };
    }
  }

  /**
   * Check if two dates represent the same day (ignoring time)
   */
  static isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Format date for display in test results
   */
  static formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Get current date in various formats for testing
   */
  static getCurrentDateFormats() {
    const today = new Date();
    return {
      iso: today.toISOString().split('T')[0], // YYYY-MM-DD
      us: today.toLocaleDateString('en-US'), // MM/DD/YYYY
      uk: today.toLocaleDateString('en-GB'), // DD/MM/YYYY
      long: today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      timestamp: today.getTime()
    };
  }

  /**
   * Validate if a string looks like a date
   */
  static looksLikeDate(value: string): boolean {
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
      /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
      /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}$/ // Month DD, YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value.trim()));
  }
}