import { parse } from 'best-effort-json-parser'

// Incomplete string, object, array
let data = parse(`[1,2,{"a":"apple`)
console.log(data) // [1, 2, { a: 'apple' }]

// Example with comments
let dataWithComments = parse(`{
  "users": [
    {
      "name": "Alice", // admin user
      "role": "admin"
    },
    {
      "name": "Bob", /* regular user
      with multi-line comment */
      "role": "user"
    }
  ],
  "version": 1.2.3
}`)
console.log(dataWithComments)
/*
{
  users: [
    { name: 'Alice', role: 'admin' },
    { name: 'Bob', role: 'user' },
  ],
  version: '1.2.3'
}
*/
