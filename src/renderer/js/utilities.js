/**
 * Utilities Module
 * Contains shared helper functions used across the application
 */

// Global utility object
window.Utils = {
  /**
   * Format a date string safely
   * @param {string} dateString - The date string to format
   * @param {string} defaultValue - Default value to return if date is invalid
   * @returns {string} Formatted date string
   */
  formatDateSafely: function(dateString, defaultValue = 'Unknown') {
    if (!dateString) return defaultValue;
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return defaultValue;
      }
      
      // Format the date to a locale string
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return defaultValue;
    }
  },
  
  /**
   * Format a currency value
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency: function(amount) {
    // Get settings from localStorage or use defaults
    const settings = JSON.parse(localStorage.getItem('settings')) || { currency: 'TZS', currencySymbol: 'TZsh' };
    
    // Format the amount with 2 decimal places
    const formattedAmount = Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Return formatted amount with currency symbol
    return `${settings.currencySymbol || 'TZsh'} ${formattedAmount}`;
  },
  
  /**
   * Create a valid ISO date string
   * @param {Date} date - The date to format
   * @returns {string} ISO formatted date string
   */
  toISOString: function(date = new Date()) {
    try {
      return date.toISOString();
    } catch (error) {
      console.error('Error converting date to ISO string:', error);
      return new Date().toISOString();
    }
  }
};

// Add the script to the page load event
document.addEventListener('DOMContentLoaded', function() {
  console.log('Utilities module initialized');
}); 