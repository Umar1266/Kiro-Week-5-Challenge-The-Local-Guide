# Slang Translator

A web-based application that helps users understand and learn local slang terms from specific regions. The Slang Translator provides a searchable database of slang terms with definitions, usage examples, and cultural context.

## Features

- **Search Functionality**: Quickly find slang terms with case-insensitive search
- **Browse Database**: Explore all available slang terms alphabetically
- **Detailed Information**: View definitions, usage examples, and cultural context for each term
- **Responsive Design**: Works seamlessly on different screen sizes
- **Fast Performance**: Optimized search and filtering with property-based testing

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Testing**: Jest for unit tests, fast-check for property-based testing
- **Data**: Markdown-based database (product.md)

## Project Structure

```
slang-translator/
├── src/                    # Backend source code
│   ├── index.js           # Express server setup
│   ├── dataLoader.js      # Database loader
│   ├── searchEngine.js    # Search logic
│   ├── browseEngine.js    # Browse logic
│   ├── validation.js      # Input validation
│   └── types.js           # Type definitions
├── public/                # Frontend files
│   ├── index.html         # Main HTML
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Styling
├── tests/                 # Test files
│   ├── integration.test.js
│   ├── api.test.js
│   ├── searchEngine.test.js
│   ├── browseEngine.test.js
│   ├── dataLoader.test.js
│   ├── validation.test.js
│   └── frontend.test.js
├── data/                  # Database
│   └── product.md        # Slang terms database
└── .kiro/specs/          # Specification documents
    └── slang-translator/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd slang-translator
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Running Tests

Run all tests:
```bash
npm test
```

Run specific test suite:
```bash
npm test -- tests/integration.test.js
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## API Endpoints

### Search Endpoint
```
GET /api/search?q={query}
```
Search for slang terms by query string.

**Parameters:**
- `q` (required): Search query string

**Response:**
```json
{
  "query": "lit",
  "results": [...],
  "totalResults": 5,
  "executionTime": 12
}
```

### Browse Endpoint
```
GET /api/browse?page={page}&limit={limit}
```
Browse all slang terms with pagination.

**Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response:**
```json
{
  "page": 1,
  "limit": 10,
  "totalItems": 20,
  "totalPages": 2,
  "items": [...]
}
```

### Term Detail Endpoint
```
GET /api/term/{id}
```
Get full details of a specific slang term.

**Parameters:**
- `id` (required): Term ID

**Response:**
```json
{
  "id": "term-id",
  "term": "lit",
  "definition": "Exciting or excellent",
  "formalTranslation": "Amazing",
  "usageExamples": [...],
  "culturalContext": {...}
}
```

## Database Format

Slang terms are stored in `data/product.md` in the following format:

```markdown
## term-name
Definition: [definition]
Formal Translation: [translation]
Usage Examples:
- [example 1]
- [example 2]
Cultural Context:
- Age Group: [age group]
- Social Setting: [setting]
- Region Specificity: [region]
- Additional Notes: [notes]
```

## Features Implemented

### Core Functionality
- ✅ Load and parse slang database from markdown
- ✅ Case-insensitive search with exact and partial matching
- ✅ Alphabetical browsing with pagination
- ✅ Term detail view with all information
- ✅ Responsive UI for different screen sizes

### Testing
- ✅ Unit tests for all components
- ✅ Property-based tests for correctness properties
- ✅ Integration tests for end-to-end workflows
- ✅ API endpoint tests
- ✅ Frontend functionality tests
- ✅ 80%+ code coverage

### Error Handling
- ✅ Invalid search queries
- ✅ Invalid pagination parameters
- ✅ Non-existent terms
- ✅ Graceful error recovery
- ✅ Special character handling

## Correctness Properties

The application is validated against the following correctness properties:

1. **Search Case Insensitivity**: Case variations return identical results
2. **Exact Match Priority**: Exact matches appear before partial matches
3. **Partial Match Inclusion**: All partial matches are included when no exact match exists
4. **Database Consistency**: All required fields are present and non-empty
5. **Search Result Completeness**: All results contain required fields
6. **Browse Alphabetical Ordering**: Terms are sorted alphabetically
7. **Empty Query Handling**: Empty queries are handled gracefully
8. **Term Count Accuracy**: Counts match actual results

## Mumbai Slangs Included

The database includes 20 authentic Mumbai slangs including:
- Tapli, Arre, Masti, Chakka, Dada, Bhaiya
- Jugaad, Chikna, Phataka, Dhakka, Gunda
- Chutiya, Paisa, Bandh, Jhunjhunna
- And more...

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing Guidelines

- Write unit tests for new functions
- Add property-based tests for universal properties
- Maintain 80%+ code coverage
- Run full test suite before submitting PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Built with Node.js and Express.js
- Tested with Jest and fast-check
- Inspired by the need to preserve and share local slang culture
