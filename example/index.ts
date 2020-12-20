import { parse } from 'best-effort-json-parser'

let data = parse(`[1,2,{"a":"apple`)
console.log(data) // [1, 2, { a: 'apple' }]
