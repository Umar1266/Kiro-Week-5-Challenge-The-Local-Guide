/**
 * BrowseEngine - Retrieves and organizes terms for browsing
 * Provides alphabetical sorting and pagination functionality
 */

/**
 * Retrieves all terms from database sorted alphabetically
 * @param {Array} database - Array of SlangTerm objects
 * @returns {Array} Sorted array of SlangTerm objects
 */
function browse(database) {
  // Validate input
  if (!Array.isArray(database)) {
    return [];
  }

  // Sort alphabetically by term name (case-insensitive)
  return [...database].sort((a, b) => {
    const termA = a.term.toLowerCase();
    const termB = b.term.toLowerCase();
    return termA.localeCompare(termB);
  });
}

/**
 * Retrieves paginated results from the database
 * @param {Array} database - Array of SlangTerm objects
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Number of items per page
 * @returns {Object} { page, limit, totalItems, totalPages, items }
 */
function paginate(database, page = 1, limit = 10) {
  // Validate inputs
  if (!Array.isArray(database)) {
    return {
      page: 1,
      limit,
      totalItems: 0,
      totalPages: 0,
      items: []
    };
  }

  // Ensure page and limit are positive integers
  const validPage = Math.max(1, Math.floor(page));
  const validLimit = Math.max(1, Math.floor(limit));

  // Get sorted database
  const sortedDatabase = browse(database);

  // Calculate pagination
  const totalItems = sortedDatabase.length;
  const totalPages = Math.ceil(totalItems / validLimit);

  // Ensure page is within valid range
  const currentPage = Math.min(validPage, Math.max(1, totalPages));

  // Calculate start and end indices
  const startIndex = (currentPage - 1) * validLimit;
  const endIndex = startIndex + validLimit;

  // Get items for current page
  const items = sortedDatabase.slice(startIndex, endIndex);

  return {
    page: currentPage,
    limit: validLimit,
    totalItems,
    totalPages,
    items
  };
}

/**
 * Gets the count of total terms in the database
 * @param {Array} database - Array of SlangTerm objects
 * @returns {number} Total count of terms
 */
function getTermCount(database) {
  if (!Array.isArray(database)) {
    return 0;
  }
  return database.length;
}

module.exports = {
  browse,
  paginate,
  getTermCount
};
