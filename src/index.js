const express = require('express');
const path = require('path');
const { loadDatabase } = require('./dataLoader');
const { search } = require('./searchEngine');
const { paginate, getTermCount } = require('./browseEngine');

const app = express();
const PORT = process.env.PORT || 3000;

// Load database on startup
let database = [];
let databaseErrors = [];
const { terms, errors } = loadDatabase();
database = terms;
databaseErrors = errors;

if (databaseErrors.length > 0) {
  console.warn('Database loading warnings:', databaseErrors);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static(path.join(__dirname, '../public')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/search - Search for slang terms
app.get('/api/search', (req, res) => {
  try {
    const query = req.query.q || '';

    // Handle empty query
    if (!query || query.trim() === '') {
      return res.status(400).json({
        error: 'Please enter a search term',
        results: [],
        totalResults: 0
      });
    }

    // Perform search
    const searchResult = search(query, database);

    // Return results
    res.json({
      query: query,
      results: searchResult.results,
      totalResults: searchResult.totalResults,
      executionTime: searchResult.executionTime
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'An error occurred while searching',
      results: [],
      totalResults: 0
    });
  }
});

// GET /api/browse - Browse all terms with pagination
app.get('/api/browse', (req, res) => {
  try {
    const pageParam = req.query.page !== undefined ? parseInt(req.query.page) : 1;
    const limitParam = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;

    // Validate pagination parameters
    if (
      isNaN(pageParam) ||
      isNaN(limitParam) ||
      pageParam < 1 ||
      limitParam < 1 ||
      !Number.isInteger(pageParam) ||
      !Number.isInteger(limitParam)
    ) {
      return res.status(400).json({
        error: 'Invalid page or limit parameters',
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        items: []
      });
    }

    const page = pageParam;
    const limit = limitParam;

    // Get paginated results
    const result = paginate(database, page, limit);

    res.json(result);
  } catch (error) {
    console.error('Browse error:', error);
    res.status(500).json({
      error: 'An error occurred while browsing',
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
      items: []
    });
  }
});

// GET /api/term/:id - Get details of a specific term
app.get('/api/term/:id', (req, res) => {
  try {
    const termId = req.params.id;

    // Find term by ID
    const term = database.find(t => t.id === termId);

    if (!term) {
      return res.status(404).json({
        error: 'Slang term not found'
      });
    }

    res.json(term);
  } catch (error) {
    console.error('Term detail error:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving term details'
    });
  }
});

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Slang Translator server running on port ${PORT}`);
  });
}

module.exports = app;
