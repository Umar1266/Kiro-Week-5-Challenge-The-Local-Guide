/**
 * SearchEngine - Performs search and filtering operations on slang terms
 * Provides case-insensitive search with exact and partial matching
 */

/**
 * Performs a case-insensitive search on the slang database
 * Returns exact matches first, then partial matches
 *
 * @param {string} query - The search query
 * @param {Array} database - Array of SlangTerm objects
 * @returns {Object} { results: SlangTerm[], totalResults: number, executionTime: number }
 */
function search(query, database) {
  const startTime = Date.now();

  // Validate inputs
  if (!query || typeof query !== 'string') {
    return {
      results: [],
      totalResults: 0,
      executionTime: Date.now() - startTime
    };
  }

  if (!Array.isArray(database)) {
    return {
      results: [],
      totalResults: 0,
      executionTime: Date.now() - startTime
    };
  }

  // Normalize query to lowercase for case-insensitive search
  const normalizedQuery = query.toLowerCase().trim();

  // Handle empty query
  if (normalizedQuery === '') {
    return {
      results: [],
      totalResults: 0,
      executionTime: Date.now() - startTime
    };
  }

  // Split query into words for multi-word search
  const queryWords = normalizedQuery.split(/\s+/);

  // Separate exact and partial matches
  const exactMatches = [];
  const partialMatches = [];

  for (const term of database) {
    const termLower = term.term.toLowerCase();
    const definitionLower = term.definition.toLowerCase();

    // Check for exact match on term name
    if (termLower === normalizedQuery) {
      exactMatches.push(term);
      continue;
    }

    // Check for partial matches (substring matching)
    let isPartialMatch = false;

    // Check if any query word matches in term or definition
    for (const word of queryWords) {
      if (termLower.includes(word) || definitionLower.includes(word)) {
        isPartialMatch = true;
        break;
      }
    }

    if (isPartialMatch) {
      partialMatches.push(term);
    }
  }

  // Combine results: exact matches first, then partial matches
  const results = [...exactMatches, ...partialMatches];

  return {
    results,
    totalResults: results.length,
    executionTime: Date.now() - startTime
  };
}

module.exports = {
  search
};
