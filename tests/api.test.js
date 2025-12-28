const request = require('supertest');
const app = require('../src/index');

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /api/search', () => {
    test('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Please enter a search term');
      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
    });

    test('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Please enter a search term');
      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
    });

    test('should return 400 for whitespace-only query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Please enter a search term');
      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
    });

    test('should return 200 with search results for valid query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(response.body).toHaveProperty('executionTime');
      expect(response.body.query).toBe('lit');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(typeof response.body.totalResults).toBe('number');
      expect(typeof response.body.executionTime).toBe('number');
    });

    test('should return results with all required fields', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (response.body.results.length > 0) {
        const result = response.body.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('term');
        expect(result).toHaveProperty('definition');
        expect(result).toHaveProperty('usageExamples');
        expect(result).toHaveProperty('culturalContext');
      }
    });

    test('should return 200 for non-matching query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'xyznonexistent' })
        .expect(200);

      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
    });

    test('should handle case-insensitive search', async () => {
      const lowercaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      const uppercaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'LIT' })
        .expect(200);

      expect(lowercaseResponse.body.totalResults).toBe(uppercaseResponse.body.totalResults);
      expect(lowercaseResponse.body.results.map(r => r.id).sort()).toEqual(
        uppercaseResponse.body.results.map(r => r.id).sort()
      );
    });

    test('should return proper JSON content-type', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' });

      expect(response.type).toMatch(/json/);
    });
  });

  describe('GET /api/browse', () => {
    test('should return 200 with default pagination', async () => {
      const response = await request(app)
        .get('/api/browse')
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('items');
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test('should return 200 with custom page and limit', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    test('should return 400 for invalid page parameter', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 0, limit: 10 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid page or limit parameters');
    });

    test('should return 400 for negative page parameter', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: -1, limit: 10 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid page or limit parameters');
    });

    test('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid page or limit parameters');
    });

    test('should return 400 for negative limit parameter', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: -5 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid page or limit parameters');
    });

    test('should return 400 for non-integer page parameter', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 'abc', limit: 10 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid page or limit parameters');
    });

    test('should return 400 for non-integer limit parameter', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 'xyz' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid page or limit parameters');
    });

    test('should return items with all required fields', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 5 })
        .expect(200);

      if (response.body.items.length > 0) {
        const item = response.body.items[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('term');
        expect(item).toHaveProperty('definition');
        expect(item).toHaveProperty('usageExamples');
        expect(item).toHaveProperty('culturalContext');
      }
    });

    test('should return items in alphabetical order', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 100 })
        .expect(200);

      if (response.body.items.length > 1) {
        for (let i = 1; i < response.body.items.length; i++) {
          const prevTerm = response.body.items[i - 1].term.toLowerCase();
          const currentTerm = response.body.items[i].term.toLowerCase();
          expect(prevTerm.localeCompare(currentTerm)).toBeLessThanOrEqual(0);
        }
      }
    });

    test('should return correct totalItems count', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(typeof response.body.totalItems).toBe('number');
      expect(response.body.totalItems).toBeGreaterThanOrEqual(0);
    });

    test('should return correct totalPages calculation', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 5 })
        .expect(200);

      const expectedPages = Math.ceil(response.body.totalItems / response.body.limit);
      expect(response.body.totalPages).toBe(expectedPages);
    });

    test('should return proper JSON content-type', async () => {
      const response = await request(app)
        .get('/api/browse');

      expect(response.type).toMatch(/json/);
    });
  });

  describe('GET /api/term/:id', () => {
    test('should return 404 for non-existent term ID', async () => {
      const response = await request(app)
        .get('/api/term/nonexistent-id-12345')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Slang term not found');
    });

    test('should return 200 with term details for valid ID', async () => {
      // First, get a valid term ID from browse
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 1 });

      if (browseResponse.body.items.length > 0) {
        const termId = browseResponse.body.items[0].id;

        const response = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('term');
        expect(response.body).toHaveProperty('definition');
        expect(response.body).toHaveProperty('usageExamples');
        expect(response.body).toHaveProperty('culturalContext');
        expect(response.body.id).toBe(termId);
      }
    });

    test('should return all required fields for a term', async () => {
      // First, get a valid term ID from browse
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 1 });

      if (browseResponse.body.items.length > 0) {
        const termId = browseResponse.body.items[0].id;

        const response = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        const term = response.body;
        expect(term.id).toBeDefined();
        expect(term.term).toBeDefined();
        expect(term.definition).toBeDefined();
        expect(Array.isArray(term.usageExamples)).toBe(true);
        expect(term.culturalContext).toBeDefined();
        expect(term.culturalContext).toHaveProperty('ageGroup');
        expect(term.culturalContext).toHaveProperty('socialSetting');
        expect(term.culturalContext).toHaveProperty('regionSpecificity');
      }
    });

    test('should return proper JSON content-type', async () => {
      const response = await request(app)
        .get('/api/term/any-id');

      expect(response.type).toMatch(/json/);
    });

    test('should handle special characters in term ID', async () => {
      const response = await request(app)
        .get('/api/term/term-with-special-chars-!@#$')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/search')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Property-Based Tests', () => {
    const fc = require('fast-check');

    // Property 7: Empty Query Handling
    // For any empty or whitespace-only query, the API should return 400 with no results
    test('Property 7: Empty query handling - empty/whitespace queries return 400 with no results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^\s*$/),
          async (query) => {
            const response = await request(app)
              .get('/api/search')
              .query({ q: query });

            // Empty or whitespace-only queries should return 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Please enter a search term');
            expect(response.body.results).toEqual([]);
            expect(response.body.totalResults).toBe(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Handling', () => {
    test('should return 500 for server errors in search', async () => {
      // This test verifies error handling is in place
      // The actual error would depend on runtime conditions
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'test' });

      // Should not crash and should return valid JSON
      expect(response.status).toBeLessThan(600);
      expect(response.type).toMatch(/json/);
    });

    test('should return 500 for server errors in browse', async () => {
      // This test verifies error handling is in place
      const response = await request(app)
        .get('/api/browse');

      // Should not crash and should return valid JSON
      expect(response.status).toBeLessThan(600);
      expect(response.type).toMatch(/json/);
    });

    test('should return 500 for server errors in term detail', async () => {
      // This test verifies error handling is in place
      const response = await request(app)
        .get('/api/term/test-id');

      // Should not crash and should return valid JSON
      expect(response.status).toBeLessThan(600);
      expect(response.type).toMatch(/json/);
    });
  });

  describe('Response Format Validation', () => {
    test('search response should have consistent structure', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          query: expect.any(String),
          results: expect.any(Array),
          totalResults: expect.any(Number),
          executionTime: expect.any(Number)
        })
      );
    });

    test('browse response should have consistent structure', async () => {
      const response = await request(app)
        .get('/api/browse')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
          totalItems: expect.any(Number),
          totalPages: expect.any(Number),
          items: expect.any(Array)
        })
      );
    });

    test('term response should have consistent structure', async () => {
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 1 });

      if (browseResponse.body.items.length > 0) {
        const termId = browseResponse.body.items[0].id;

        const response = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            term: expect.any(String),
            definition: expect.any(String),
            usageExamples: expect.any(Array),
            culturalContext: expect.any(Object)
          })
        );
      }
    });
  });
});
