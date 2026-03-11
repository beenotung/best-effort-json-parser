# best-effort-json-parser

Parse incomplete JSON text in best-effort manner with support for comments. Useful for partial JSON responses, broken network packages, or LLM responses exceeding tokens. It can also read configuration files with comments.

[![npm Package Version](https://img.shields.io/npm/v/best-effort-json-parser)](https://www.npmjs.com/package/best-effort-json-parser)
[![Minified Package Size](https://img.shields.io/bundlephobia/min/best-effort-json-parser)](https://bundlephobia.com/package/best-effort-json-parser)
[![Minified and Gzipped Package Size](https://img.shields.io/bundlephobia/minzip/best-effort-json-parser)](https://bundlephobia.com/package/best-effort-json-parser)
[![npm Package Downloads](https://img.shields.io/npm/dm/best-effort-json-parser)](https://www.npmtrends.com/best-effort-json-parser)

## Features

- Typescript support
- Isomorphic package: works in Node.js and browsers
- Comment support: `// inline`, `/* multi-line */`, and `<!-- HTML-style -->` comments

## Installation

```bash
npm install best-effort-json-parser
```

You can also install `best-effort-json-parser` with [pnpm](https://pnpm.io/), [yarn](https://yarnpkg.com/), or [slnpm](https://github.com/beenotung/slnpm)

## Usage Example

### Parsing incomplete JSON text

If the string, object, or array is not complete, the parser will return the partial data.

```typescript
import { parse } from 'best-effort-json-parser'

let data = parse(`[1, 2, {"a": "apple`)
console.log(data) // [1, 2, { a: 'apple' }]
```

### Parsing json with comments

Multiple types of comments are supported:

```typescript
import { parse } from 'best-effort-json-parser'

let config = parse(`{
  "database": {
    "host": "localhost", // database server
    "port": 5432, /* default port */
    "ssl": true
  },
  "features": ["auth", "api"] <!-- injected by LLM -->
}`)
```

Comments inside strings are preserved and not treated as comments:

```typescript
let data = parse(`{
  "inline_comment": "// this is not a comment",
  "block_comment": "/* neither is this */",
  "html_comment": \`<!-- \${variable} -->\`,
  "value": 42
}`)
```

**Note:** The parser also supports template literals with backticks (\`) for strings, in addition to single and double quotes.

## Error Logging

By default, the parser logs errors to `console.error`. You can control error logging behavior:

```typescript
import {
  disableErrorLogging,
  enableErrorLogging,
  setErrorLogger,
} from 'best-effort-json-parser'

// Disable error logging completely
disableErrorLogging()

// Re-enable error logging (default behavior)
enableErrorLogging()

// Set a custom error logger
setErrorLogger((message, data) => {
  // Your custom logging logic here
  console.log('Custom error:', message, data)

  // Common destinations for error data:
  // - Database storage for analysis
  // - File system logging
  // - Third-party services (Sentry, LogRocket, etc.)
  // - Monitoring and alerting systems
})
```

## Typescript Signature

```typescript
// Main parse function
function parse(s: string | undefined | null): any

// Parse namespace with additional properties
namespace parse {
  lastParseReminding: string | undefined
  onExtraToken: (text: string, data: any, reminding: string) => void | undefined
}

// Error logging functions
function setErrorLogger(logger: (message: string, data?: any) => void): void
function disableErrorLogging(): void
function enableErrorLogging(): void
```

More examples see [parse.spec.ts](./src/parse.spec.ts)

## License

This is free and open-source software (FOSS) with
[BSD-2-Clause License](./LICENSE)
