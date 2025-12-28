/**
 * Validation schemas for Slang Translator data models
 * Provides functions to validate data integrity
 */

/**
 * Validates a UsageExample object
 * @param {Object} example - The usage example to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateUsageExample(example) {
  const errors = [];

  if (!example || typeof example !== 'object') {
    errors.push('Usage example must be an object');
    return { isValid: false, errors };
  }

  if (!example.example || typeof example.example !== 'string' || example.example.trim() === '') {
    errors.push('Usage example must have a non-empty "example" field');
  }

  if (example.context !== undefined && typeof example.context !== 'string') {
    errors.push('Usage example "context" field must be a string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a CulturalContext object
 * @param {Object} context - The cultural context to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateCulturalContext(context) {
  const errors = [];

  if (!context || typeof context !== 'object') {
    errors.push('Cultural context must be an object');
    return { isValid: false, errors };
  }

  if (!context.ageGroup || typeof context.ageGroup !== 'string' || context.ageGroup.trim() === '') {
    errors.push('Cultural context must have a non-empty "ageGroup" field');
  }

  if (!context.socialSetting || typeof context.socialSetting !== 'string' || context.socialSetting.trim() === '') {
    errors.push('Cultural context must have a non-empty "socialSetting" field');
  }

  if (!context.regionSpecificity || typeof context.regionSpecificity !== 'string' || context.regionSpecificity.trim() === '') {
    errors.push('Cultural context must have a non-empty "regionSpecificity" field');
  }

  if (context.additionalNotes !== undefined && typeof context.additionalNotes !== 'string') {
    errors.push('Cultural context "additionalNotes" field must be a string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a SlangTerm object
 * @param {Object} term - The slang term to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateSlangTerm(term) {
  const errors = [];

  if (!term || typeof term !== 'object') {
    errors.push('Slang term must be an object');
    return { isValid: false, errors };
  }

  // Validate id
  if (!term.id || typeof term.id !== 'string' || term.id.trim() === '') {
    errors.push('Slang term must have a non-empty "id" field');
  }

  // Validate term
  if (!term.term || typeof term.term !== 'string' || term.term.trim() === '') {
    errors.push('Slang term must have a non-empty "term" field');
  }

  // Validate definition
  if (!term.definition || typeof term.definition !== 'string' || term.definition.trim() === '') {
    errors.push('Slang term must have a non-empty "definition" field');
  }

  // Validate formalTranslation (optional)
  if (term.formalTranslation !== undefined && typeof term.formalTranslation !== 'string') {
    errors.push('Slang term "formalTranslation" field must be a string if provided');
  }

  // Validate usageExamples
  if (!Array.isArray(term.usageExamples)) {
    errors.push('Slang term must have "usageExamples" as an array');
  } else if (term.usageExamples.length === 0) {
    errors.push('Slang term must have at least one usage example');
  } else {
    term.usageExamples.forEach((example, index) => {
      const exampleValidation = validateUsageExample(example);
      if (!exampleValidation.isValid) {
        errors.push(`Usage example at index ${index}: ${exampleValidation.errors.join(', ')}`);
      }
    });
  }

  // Validate culturalContext
  if (!term.culturalContext) {
    errors.push('Slang term must have a "culturalContext" field');
  } else {
    const contextValidation = validateCulturalContext(term.culturalContext);
    if (!contextValidation.isValid) {
      errors.push(`Cultural context: ${contextValidation.errors.join(', ')}`);
    }
  }

  // Validate timestamps (optional)
  if (term.createdAt !== undefined && typeof term.createdAt !== 'string') {
    errors.push('Slang term "createdAt" field must be a string if provided');
  }

  if (term.updatedAt !== undefined && typeof term.updatedAt !== 'string') {
    errors.push('Slang term "updatedAt" field must be a string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a SearchResult object
 * @param {Object} result - The search result to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateSearchResult(result) {
  const errors = [];

  if (!result || typeof result !== 'object') {
    errors.push('Search result must be an object');
    return { isValid: false, errors };
  }

  if (typeof result.query !== 'string') {
    errors.push('Search result must have a "query" field of type string');
  }

  if (typeof result.totalResults !== 'number' || result.totalResults < 0) {
    errors.push('Search result must have a "totalResults" field of type number >= 0');
  }

  if (!Array.isArray(result.results)) {
    errors.push('Search result must have "results" as an array');
  } else {
    result.results.forEach((term, index) => {
      const termValidation = validateSlangTerm(term);
      if (!termValidation.isValid) {
        errors.push(`Result at index ${index}: ${termValidation.errors.join(', ')}`);
      }
    });
  }

  if (typeof result.executionTime !== 'number' || result.executionTime < 0) {
    errors.push('Search result must have an "executionTime" field of type number >= 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a BrowseResult object
 * @param {Object} result - The browse result to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateBrowseResult(result) {
  const errors = [];

  if (!result || typeof result !== 'object') {
    errors.push('Browse result must be an object');
    return { isValid: false, errors };
  }

  if (typeof result.page !== 'number' || result.page < 1) {
    errors.push('Browse result must have a "page" field of type number >= 1');
  }

  if (typeof result.limit !== 'number' || result.limit < 1) {
    errors.push('Browse result must have a "limit" field of type number >= 1');
  }

  if (typeof result.totalItems !== 'number' || result.totalItems < 0) {
    errors.push('Browse result must have a "totalItems" field of type number >= 0');
  }

  if (typeof result.totalPages !== 'number' || result.totalPages < 0) {
    errors.push('Browse result must have a "totalPages" field of type number >= 0');
  }

  if (!Array.isArray(result.items)) {
    errors.push('Browse result must have "items" as an array');
  } else {
    result.items.forEach((term, index) => {
      const termValidation = validateSlangTerm(term);
      if (!termValidation.isValid) {
        errors.push(`Item at index ${index}: ${termValidation.errors.join(', ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateUsageExample,
  validateCulturalContext,
  validateSlangTerm,
  validateSearchResult,
  validateBrowseResult
};
