# best-effort-json-parser

Parse incomplete json text in best-effort manner

[![npm Package Version](https://img.shields.io/npm/v/best-effort-json-parser.svg?maxAge=3600)](https://www.npmjs.com/package/best-effort-json-parser)

## Example
```typescript
import { parse } from 'best-effort-json-parser'

let data = parse(`[1, 2, {"a": "apple`)
console.log(data) // [1, 2, { a: 'apple' }]
```

More examples see [parse.spec.ts](./src/parse.spec.ts)
