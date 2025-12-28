const {
  validateUsageExample,
  validateCulturalContext,
  validateSlangTerm,
  validateSearchResult,
  validateBrowseResult
} = require('../src/validation');

describe('Validation Schemas', () => {
  describe('validateUsageExample', () => {
    test('should validate a valid usage example', () => {
      const example = {
        example: 'That party was lit!',
        context: 'casual gathering'
      };
      const result = validateUsageExample(example);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate a usage example without context', () => {
      const example = {
        example: 'That party was lit!'
      };
      const result = validateUsageExample(example);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject example with empty example field', () => {
      const example = {
        example: '',
        context: 'casual'
      };
      const result = validateUsageExample(example);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject example with missing example field', () => {
      const example = {
        context: 'casual'
      };
      const result = validateUsageExample(example);
      expect(result.isValid).toBe(false);
    });

    test('should reject non-object input', () => {
      const result = validateUsageExample('not an object');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCulturalContext', () => {
    test('should validate a valid cultural context', () => {
      const context = {
        ageGroup: 'teens',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide',
        additionalNotes: 'Popular in urban areas'
      };
      const result = validateCulturalContext(context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate cultural context without additional notes', () => {
      const context = {
        ageGroup: 'young adults',
        socialSetting: 'street',
        regionSpecificity: 'neighborhood'
      };
      const result = validateCulturalContext(context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject context with missing ageGroup', () => {
      const context = {
        socialSetting: 'casual',
        regionSpecificity: 'city-wide'
      };
      const result = validateCulturalContext(context);
      expect(result.isValid).toBe(false);
    });

    test('should reject context with empty socialSetting', () => {
      const context = {
        ageGroup: 'teens',
        socialSetting: '',
        regionSpecificity: 'city-wide'
      };
      const result = validateCulturalContext(context);
      expect(result.isValid).toBe(false);
    });

    test('should reject non-object input', () => {
      const result = validateCulturalContext(null);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateSlangTerm', () => {
    test('should validate a complete valid slang term', () => {
      const term = {
        id: 'term-1',
        term: 'lit',
        definition: 'Exciting or excellent',
        formalTranslation: 'Amazing',
        usageExamples: [
          { example: 'That party was lit!' },
          { example: 'Your outfit is lit!', context: 'compliment' }
        ],
        culturalContext: {
          ageGroup: 'teens',
          socialSetting: 'casual',
          regionSpecificity: 'city-wide'
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };
      const result = validateSlangTerm(term);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate slang term without optional fields', () => {
      const term = {
        id: 'term-1',
        term: 'lit',
        definition: 'Exciting or excellent',
        usageExamples: [
          { example: 'That party was lit!' }
        ],
        culturalContext: {
          ageGroup: 'teens',
          socialSetting: 'casual',
          regionSpecificity: 'city-wide'
        }
      };
      const result = validateSlangTerm(term);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject term with missing id', () => {
      const term = {
        term: 'lit',
        definition: 'Exciting or excellent',
        usageExamples: [{ example: 'That party was lit!' }],
        culturalContext: {
          ageGroup: 'teens',
          socialSetting: 'casual',
          regionSpecificity: 'city-wide'
        }
      };
      const result = validateSlangTerm(term);
      expect(result.isValid).toBe(false);
    });

    test('should reject term with empty definition', () => {
      const term = {
        id: 'term-1',
        term: 'lit',
        definition: '',
        usageExamples: [{ example: 'That party was lit!' }],
        culturalContext: {
          ageGroup: 'teens',
          socialSetting: 'casual',
          regionSpecificity: 'city-wide'
        }
      };
      const result = validateSlangTerm(term);
      expect(result.isValid).toBe(false);
    });

    test('should reject term with no usage examples', () => {
      const term = {
        id: 'term-1',
        term: 'lit',
        definition: 'Exciting or excellent',
        usageExamples: [],
        culturalContext: {
          ageGroup: 'teens',
          socialSetting: 'casual',
          regionSpecificity: 'city-wide'
        }
      };
      const result = validateSlangTerm(term);
      expect(result.isValid).toBe(false);
    });

    test('should reject term with missing culturalContext', () => {
      const term = {
        id: 'term-1',
        term: 'lit',
        definition: 'Exciting or excellent',
        usageExamples: [{ example: 'That party was lit!' }]
      };
      const result = validateSlangTerm(term);
      expect(result.isValid).toBe(false);
    });

    test('should reject non-object input', () => {
      const result = validateSlangTerm(undefined);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateSearchResult', () => {
    test('should validate a valid search result', () => {
      const result = {
        query: 'lit',
        totalResults: 1,
        results: [
          {
            id: 'term-1',
            term: 'lit',
            definition: 'Exciting or excellent',
            usageExamples: [{ example: 'That party was lit!' }],
            culturalContext: {
              ageGroup: 'teens',
              socialSetting: 'casual',
              regionSpecificity: 'city-wide'
            }
          }
        ],
        executionTime: 5
      };
      const validation = validateSearchResult(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate search result with no results', () => {
      const result = {
        query: 'nonexistent',
        totalResults: 0,
        results: [],
        executionTime: 2
      };
      const validation = validateSearchResult(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject result with missing query', () => {
      const result = {
        totalResults: 0,
        results: [],
        executionTime: 2
      };
      const validation = validateSearchResult(result);
      expect(validation.isValid).toBe(false);
    });

    test('should reject result with negative totalResults', () => {
      const result = {
        query: 'lit',
        totalResults: -1,
        results: [],
        executionTime: 2
      };
      const validation = validateSearchResult(result);
      expect(validation.isValid).toBe(false);
    });

    test('should reject non-object input', () => {
      const validation = validateSearchResult(null);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('validateBrowseResult', () => {
    test('should validate a valid browse result', () => {
      const result = {
        page: 1,
        limit: 10,
        totalItems: 50,
        totalPages: 5,
        items: [
          {
            id: 'term-1',
            term: 'lit',
            definition: 'Exciting or excellent',
            usageExamples: [{ example: 'That party was lit!' }],
            culturalContext: {
              ageGroup: 'teens',
              socialSetting: 'casual',
              regionSpecificity: 'city-wide'
            }
          }
        ]
      };
      const validation = validateBrowseResult(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate browse result with empty items', () => {
      const result = {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        items: []
      };
      const validation = validateBrowseResult(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject result with page < 1', () => {
      const result = {
        page: 0,
        limit: 10,
        totalItems: 50,
        totalPages: 5,
        items: []
      };
      const validation = validateBrowseResult(result);
      expect(validation.isValid).toBe(false);
    });

    test('should reject result with limit < 1', () => {
      const result = {
        page: 1,
        limit: 0,
        totalItems: 50,
        totalPages: 5,
        items: []
      };
      const validation = validateBrowseResult(result);
      expect(validation.isValid).toBe(false);
    });

    test('should reject result with negative totalItems', () => {
      const result = {
        page: 1,
        limit: 10,
        totalItems: -1,
        totalPages: 5,
        items: []
      };
      const validation = validateBrowseResult(result);
      expect(validation.isValid).toBe(false);
    });

    test('should reject non-object input', () => {
      const validation = validateBrowseResult('invalid');
      expect(validation.isValid).toBe(false);
    });
  });
});
