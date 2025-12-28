/**
 * TypeScript-like type definitions for Slang Translator
 * Using JSDoc for type documentation in JavaScript
 */

/**
 * @typedef {Object} UsageExample
 * @property {string} example - Example sentence
 * @property {string} [context] - Context for the example (optional)
 */

/**
 * @typedef {Object} CulturalContext
 * @property {string} ageGroup - e.g., "teens", "young adults", "all ages"
 * @property {string} socialSetting - e.g., "casual", "formal", "street"
 * @property {string} regionSpecificity - e.g., "city-wide", "neighborhood", "specific group"
 * @property {string} [additionalNotes] - Any other relevant context (optional)
 */

/**
 * @typedef {Object} SlangTerm
 * @property {string} id - Unique identifier
 * @property {string} term - The slang term itself
 * @property {string} definition - Formal meaning
 * @property {string} [formalTranslation] - Standard language equivalent (optional)
 * @property {UsageExample[]} usageExamples - Array of usage examples
 * @property {CulturalContext} culturalContext - Cultural context information
 * @property {string} [createdAt] - ISO timestamp (optional)
 * @property {string} [updatedAt] - ISO timestamp (optional)
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} query - Original search query
 * @property {number} totalResults - Total matching terms
 * @property {SlangTerm[]} results - Array of matching terms
 * @property {number} executionTime - Time taken in milliseconds
 */

/**
 * @typedef {Object} BrowseResult
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} totalItems - Total terms in database
 * @property {number} totalPages - Total pages available
 * @property {SlangTerm[]} items - Terms for current page
 */

module.exports = {
  // Type definitions are exported for documentation purposes
  // In JavaScript, these are just JSDoc comments
};
