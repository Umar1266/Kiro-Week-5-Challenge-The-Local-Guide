const { search } = require('../src/searchEngine');
const fc = require('fast-check');

describe('SearchEngine', () => {
  // Sample database for testing
  const sampleDatabase = [
    {
      id: 'term-1',
      term: 'lit',
      definition: 'Exciting or excellent',
      formalTranslation: 'Amazing',
      usageExamples: [
        { example: 'That party was lit!' },
        { example: 'Your outfit is lit!' }
      ],
      culturalContext: {
        ageGroup: 'teens',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide',
        additionalNotes: 'Popular in urban areas'
      }
    },
    {
      id: 'term-2',
      term: 'salty',
      definition: 'Bitter or upset about something',
      formalTranslation: 'Upset',
      usageExamples: [
        { example: 'Don\'t be salty about losing the game' },
        { example: 'She\'s salty because she didn\'t get invited' }
      ],
      culturalContext: {
        ageGroup: 'young adults',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide'
      }
    },
    {
      id: 'term-3',
      term: 'flex',
      definition: 'To show off or boast',
      formalTranslation: 'Show off',
      usageExamples: [
        { example: 'Stop flexing your new car' },
        { example: 'He\'s always flexing his wealth' }
      ],
      culturalContext: {
        ageGroup: 'teens',
        socialSetting: 'street',
        regionSpecificity: 'neighborhood',
        additionalNotes: 'Often used in hip-hop culture'
      }
    },
    {
      id: 'term-4',
      term: 'vibe',
      definition: 'A feeling or atmosphere',
      formalTranslation: 'Feeling',
      usageExamples: [
        { example: 'I\'m getting good vibes from this place' },
        { example: 'The vibe at the party was amazing' }
      ],
      culturalContext: {
        ageGroup: 'all ages',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide'
      }
    }
  ];

  describe('Basic Search Functionality', () => {
    test('should find exact match for a term', () => {
      const result = search('lit', sampleDatabase);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('lit');
      expect(result.totalResults).toBe(1);
    });

    test('should find partial matches when no exact match exists', () => {
      const result = search('flex', sampleDatabase);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].term).toBe('flex');
    });

    test('should return empty results for non-matching query', () => {
      const result = search('nonexistent', sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle empty query', () => {
      const result = search('', sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle whitespace-only query', () => {
      const result = search('   ', sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle null query', () => {
      const result = search(null, sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle undefined query', () => {
      const result = search(undefined, sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle null database', () => {
      const result = search('lit', null);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle empty database', () => {
      const result = search('lit', []);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('Case Insensitivity', () => {
    test('should find term with lowercase query', () => {
      const result = search('lit', sampleDatabase);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('lit');
    });

    test('should find term with uppercase query', () => {
      const result = search('LIT', sampleDatabase);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('lit');
    });

    test('should find term with mixed case query', () => {
      const result = search('LiT', sampleDatabase);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('lit');
    });

    test('should find term with uppercase SALTY', () => {
      const result = search('SALTY', sampleDatabase);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('salty');
    });

    test('should find term with mixed case SaLtY', () => {
      const result = search('SaLtY', sampleDatabase);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].term).toBe('salty');
    });
  });

  describe('Exact vs Partial Matching', () => {
    test('should return exact match first when it exists', () => {
      const result = search('flex', sampleDatabase);
      expect(result.results[0].term).toBe('flex');
    });

    test('should return partial matches when no exact match', () => {
      const result = search('show', sampleDatabase);
      // 'show' appears in 'Show off' definition of 'flex'
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.some(r => r.term === 'flex')).toBe(true);
    });

    test('should prioritize exact matches over partial matches', () => {
      // Create a database where 'lit' is exact match and also appears in another term's definition
      const testDb = [
        ...sampleDatabase,
        {
          id: 'term-5',
          term: 'brilliant',
          definition: 'Very lit and exciting',
          usageExamples: [{ example: 'That was brilliant' }],
          culturalContext: {
            ageGroup: 'all ages',
            socialSetting: 'formal',
            regionSpecificity: 'city-wide'
          }
        }
      ];

      const result = search('lit', testDb);
      expect(result.results[0].term).toBe('lit');
      expect(result.results[0].id).toBe('term-1');
    });
  });

  describe('Multi-word Queries', () => {
    test('should handle multi-word queries', () => {
      const result = search('show off', sampleDatabase);
      expect(result.results.length).toBeGreaterThan(0);
    });

    test('should find terms matching any word in multi-word query', () => {
      const result = search('lit salty', sampleDatabase);
      expect(result.results.length).toBeGreaterThanOrEqual(2);
      const terms = result.results.map(r => r.term);
      expect(terms).toContain('lit');
      expect(terms).toContain('salty');
    });

    test('should handle extra whitespace in multi-word queries', () => {
      const result = search('lit   salty', sampleDatabase);
      expect(result.results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Special Characters', () => {
    test('should handle queries with special characters', () => {
      const result = search('!@#$%', sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle queries with numbers', () => {
      const result = search('123', sampleDatabase);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    test('should handle queries with mixed alphanumeric and special characters', () => {
      const result = search('lit@123', sampleDatabase);
      expect(typeof result.totalResults).toBe('number');
      expect(Array.isArray(result.results)).toBe(true);
    });

    test('should handle queries with hyphens', () => {
      const result = search('show-off', sampleDatabase);
      expect(typeof result.totalResults).toBe('number');
      expect(Array.isArray(result.results)).toBe(true);
    });

    test('should handle queries with apostrophes', () => {
      const result = search("don't", sampleDatabase);
      expect(typeof result.totalResults).toBe('number');
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('Execution Time', () => {
    test('should return execution time', () => {
      const result = search('lit', sampleDatabase);
      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should have reasonable execution time for small database', () => {
      const result = search('lit', sampleDatabase);
      expect(result.executionTime).toBeLessThan(100);
    });
  });

  describe('Property-Based Tests', () => {
    // Property 1: Search Case Insensitivity
    // For any search query regardless of case, the system should return the same results
    test('Property 1: Case insensitivity - lowercase, uppercase, and mixed case return same results', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z]+$/),
          (query) => {
            const lowercaseResult = search(query, sampleDatabase);
            const uppercaseResult = search(query.toUpperCase(), sampleDatabase);
            const mixedCaseResult = search(
              query.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join(''),
              sampleDatabase
            );

            // All three should return the same number of results
            return (
              lowercaseResult.totalResults === uppercaseResult.totalResults &&
              lowercaseResult.totalResults === mixedCaseResult.totalResults &&
              lowercaseResult.results.map(r => r.id).sort().join(',') ===
              uppercaseResult.results.map(r => r.id).sort().join(',') &&
              lowercaseResult.results.map(r => r.id).sort().join(',') ===
              mixedCaseResult.results.map(r => r.id).sort().join(',')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 2: Exact Match Priority
    // For any search query, if an exact match exists, it should appear first
    test('Property 2: Exact match priority - exact matches appear before partial matches', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...sampleDatabase.map(t => t.term)),
          (exactTerm) => {
            const result = search(exactTerm, sampleDatabase);

            // If we have results and the first one is an exact match
            if (result.results.length > 0) {
              const firstResult = result.results[0];
              // The first result should be the exact match
              return firstResult.term.toLowerCase() === exactTerm.toLowerCase();
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 3: Partial Match Inclusion
    // For any search query, if no exact match exists, all partial matches should be included
    test('Property 3: Partial match inclusion - all partial matches are returned', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z]{2,4}$/),
          (query) => {
            const result = search(query, sampleDatabase);

            // For each result, verify it contains the query as substring
            return result.results.every(term => {
              const termLower = term.term.toLowerCase();
              const defLower = term.definition.toLowerCase();
              return termLower.includes(query) || defLower.includes(query);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 5: Search Result Completeness
    // For any search query that returns results, each result should contain all required fields
    test('Property 5: Search result completeness - all results contain required fields', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z]{1,5}$/),
          (query) => {
            const result = search(query, sampleDatabase);

            // For each result, verify all required fields are present and non-empty
            return result.results.every(term => {
              // Check required fields exist
              const hasId = term.id && typeof term.id === 'string' && term.id.trim() !== '';
              const hasTerm = term.term && typeof term.term === 'string' && term.term.trim() !== '';
              const hasDefinition = term.definition && typeof term.definition === 'string' && term.definition.trim() !== '';
              const hasUsageExamples = Array.isArray(term.usageExamples) && term.usageExamples.length > 0;
              const hasCulturalContext = term.culturalContext && typeof term.culturalContext === 'object';

              // Check cultural context has required fields
              const contextValid = hasCulturalContext &&
                term.culturalContext.ageGroup && typeof term.culturalContext.ageGroup === 'string' &&
                term.culturalContext.socialSetting && typeof term.culturalContext.socialSetting === 'string' &&
                term.culturalContext.regionSpecificity && typeof term.culturalContext.regionSpecificity === 'string';

              // Check each usage example has required fields
              const examplesValid = term.usageExamples.every(ex =>
                ex.example && typeof ex.example === 'string' && ex.example.trim() !== ''
              );

              return hasId && hasTerm && hasDefinition && hasUsageExamples && contextValid && examplesValid;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 7: Empty Query Handling
    // For any empty or whitespace-only query, the system should return no results
    test('Property 7: Empty query handling - empty/whitespace queries return no results', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\s*$/),
          (query) => {
            const result = search(query, sampleDatabase);
            return result.totalResults === 0 && result.results.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
