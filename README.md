# OpenScrape

An open-source web scraping tool with LLM-ready data extraction capabilities, built with TypeScript and Playwright.

## Features

- Extract text content from web pages
- Capture screenshots
- Extract links and images
- Wait for specific elements before scraping
- Output results in JSON format
- Docker support for containerized execution

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openscrape.git
cd openscrape

# Install dependencies
npm install

# Build the project
npm run build
```

### Docker Installation

```bash
# Build the Docker image
docker build -t openscrape .

# Run the container
docker run -v $(pwd)/output:/app/output openscrape scrape -u "https://example.com" -o /app/output/result.json
```

## Usage

### Basic Usage

```bash
# Scrape a website and extract text
npx openscrape scrape -u "https://example.com" -t

# Take a screenshot
npx openscrape scrape -u "https://example.com" -s

# Extract links
npx openscrape scrape -u "https://example.com" -l

# Extract images
npx openscrape scrape -u "https://example.com" -i

# Wait for a specific element before scraping
npx openscrape scrape -u "https://example.com" -w "#main-content"

# Save results to a file
npx openscrape scrape -u "https://example.com" -t -o results.json
```

### Command Line Options

- `-u, --url <url>`: URL to scrape (required)
- `-w, --wait-for <selector>`: Wait for a specific selector before scraping
- `-s, --screenshot`: Take a screenshot of the page
- `-t, --text`: Extract text content
- `-l, --links`: Extract links
- `-i, --images`: Extract images
- `-o, --output <file>`: Output file path (JSON)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build the project
npm run build
```

## License

MIT 