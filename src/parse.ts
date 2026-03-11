type Error = unknown

let logError = console.error

// for testing (spy/mock)
export function setErrorLogger(
  logger: (message: string, data?: any) => void,
): void {
  logError = logger
}

export function disableErrorLogging(): void {
  logError = () => {
    /* do not output to console */
  }
}

export function enableErrorLogging(): void {
  logError = console.error
}

export function stripComments(text: string): string {
  const buffer: string[] = []

  let in_string = false
  let string_char = ''
  let string_escaped = false

  let in_inline_comment = false

  let in_block_comment = false
  let saw_star = false

  let in_html_comment = false
  let saw_hyphen = 0

  for (const char of text) {
    // handle string content
    if (in_string) {
      // handle escaped sequence payload
      if (string_escaped) {
        string_escaped = false
        buffer.push(char)
        continue
      }

      // handle start of escape sequence
      if (char === '\\') {
        string_escaped = true
        buffer.push(char)
        continue
      }

      // handle end of string
      if (char === string_char) {
        in_string = false
        buffer.push(char)
        continue
      }

      // otherwise take the content of string
      buffer.push(char)
      continue
    }

    // handle inline comment content
    if (in_inline_comment) {
      // handle end of inline comment
      if (char === '\n') {
        in_inline_comment = false
        continue
      }

      // otherwise ignore the content of comment
      continue
    }

    const buffer_length = buffer.length
    const last_char = buffer_length === 0 ? '' : buffer[buffer_length - 1]

    // handle block comment content
    if (in_block_comment) {
      // handle end of block comment
      if (char === '*') {
        saw_star = true
        continue
      }
      if (saw_star && char === '/') {
        in_block_comment = false
        continue
      }

      // otherwise ignore the content of comment
      saw_star = false
      continue
    }

    // handle html comment content
    if (in_html_comment) {
      // handle end of html comment
      if (char === '-') {
        saw_hyphen++
        continue
      }
      if (saw_hyphen >= 2 && char === '>') {
        in_html_comment = false
        continue
      }

      // otherwise ignore the content of comment
      saw_hyphen = 0
      continue
    }

    // handle start of inline comment
    if (last_char === '/' && char === '/') {
      buffer.pop()
      in_inline_comment = true
      continue
    }

    // handle start of block comment
    if (last_char === '/' && char === '*') {
      buffer.pop()
      in_block_comment = true
      saw_star = false
      continue
    }

    // handle start of string
    if (char === '"' || char === "'" || char === '`') {
      in_string = true
      string_char = char
      string_escaped = false
      buffer.push(char)
      continue
    }

    // handle start of html comment "<!--"
    if (
      buffer_length >= 4 &&
      char === '-' &&
      buffer[buffer_length - 1] === '-' &&
      buffer[buffer_length - 2] === '!' &&
      buffer[buffer_length - 3] === '<'
    ) {
      in_html_comment = true
      buffer.pop()
      buffer.pop()
      buffer.pop()
      continue
    }

    // otherwise take the content of the text
    buffer.push(char)
  }
  return buffer.join('')
}

export function parse(s: string | undefined | null): any {
  if (s === undefined) {
    return undefined
  }
  if (s === null) {
    return null
  }
  if (s === '') {
    return ''
  }
  // strip comments first
  s = stripComments(s)
  // remove incomplete escaped characters at the end of the string
  s = s.replace(/\\+$/, match =>
    match.length % 2 === 0 ? match : match.slice(0, -1),
  )
  try {
    return JSON.parse(s)
  } catch (e) {
    const [data, reminding] =
      s.trimLeft()[0] === ':'
        ? parseAny(s, e)
        : parseAny(s, e, parseStringWithoutQuote)
    parse.lastParseReminding = reminding
    if (parse.onExtraToken && reminding.length > 0) {
      const trimmedReminding = reminding.trimRight()
      parse.lastParseReminding = trimmedReminding
      if (trimmedReminding.length > 0) {
        parse.onExtraToken(s, data, trimmedReminding)
      }
    }
    return data
  }
}

export namespace parse {
  export let lastParseReminding: string | undefined
  export let onExtraToken: (
    text: string,
    data: any,
    reminding: string,
  ) => void | undefined = (text, data, reminding) => {
    logError('parsed json with extra tokens:', {
      text,
      data,
      reminding,
    })
  }
}

function parseAny(
  s: string,
  e: Error,
  fallback?: Parser<any>,
): ParseResult<any> {
  const parser = parsers[s[0]] || fallback
  if (!parser) {
    logError(`no parser registered for ${JSON.stringify(s[0])}:`, { s })
    throw e
  }
  return parser(s, e)
}

function parseStringCasual(
  s: string,
  e: Error,
  delimiters?: string[],
): ParseResult<string> {
  if (s[0] === '"') {
    return parseString(s)
  }
  if (s[0] === "'") {
    return parseSingleQuoteString(s)
  }
  if (s[0] === '`') {
    return parseBacktickString(s)
  }
  return parseStringWithoutQuote(s, e, delimiters)
}

type Code = string
type Parser<T> = (s: Code, e: Error) => ParseResult<T>
type ParseResult<T> = [T, Code]

const parsers: Record<string, Parser<any>> = {}

function skipSpace(s: string): string {
  return s.trimLeft()
}

parsers[' '] = parseSpace
parsers['\r'] = parseSpace
parsers['\n'] = parseSpace
parsers['\t'] = parseSpace

function parseSpace(s: string, e: Error) {
  s = skipSpace(s)
  return parseAny(s, e)
}

parsers['['] = parseArray

function parseArray(s: string, e: Error): ParseResult<any[]> {
  s = s.substr(1) // skip starting '['
  const acc: any[] = []
  s = skipSpace(s)
  for (; s.length > 0; ) {
    if (s[0] === ']') {
      s = s.substr(1) // skip ending ']'
      break
    }
    const res = parseAny(s, e, (s, e) =>
      parseStringWithoutQuote(s, e, [',', ']']),
    )
    acc.push(res[0])
    s = res[1]
    s = skipSpace(s)
    if (s[0] === ',') {
      s = s.substring(1)
      s = skipSpace(s)
    }
  }
  return [acc, s]
}

for (const c of '0123456789.-'.slice()) {
  parsers[c] = parseNumber
}

function parseNumber(s: string): ParseResult<number | string> {
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (parsers[c] === parseNumber) {
      continue
    }
    const num = s.substring(0, i)
    s = s.substring(i)
    return [numToStr(num), s]
  }
  return [numToStr(s), '']
}

function numToStr(s: string) {
  if (s === '-') {
    return -0
  }
  const num = +s
  if (Number.isNaN(num)) {
    return s
  }
  return num
}

parsers['"'] = parseString

function parseString(s: string): ParseResult<string> {
  for (let i = 1; i < s.length; i++) {
    const c = s[i]
    if (c === '\\') {
      i++
      continue
    }
    if (c === '"') {
      const str = fixEscapedCharacters(s.substring(0, i + 1))
      s = s.substring(i + 1)
      return [JSON.parse(str), s]
    }
  }
  return [JSON.parse(fixEscapedCharacters(s) + '"'), '']
}

function fixEscapedCharacters(s: string): string {
  return s.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
}

parsers["'"] = parseSingleQuoteString

function parseSingleQuoteString(s: string): ParseResult<string> {
  for (let i = 1; i < s.length; i++) {
    const c = s[i]
    if (c === '\\') {
      i++
      continue
    }
    if (c === "'") {
      const str = fixEscapedCharacters(s.substring(0, i + 1))
      s = s.substring(i + 1)
      return [JSON.parse('"' + str.slice(1, -1) + '"'), s]
    }
  }
  return [JSON.parse('"' + fixEscapedCharacters(s.slice(1)) + '"'), '']
}

parsers['`'] = parseBacktickString

function parseBacktickString(s: string): ParseResult<string> {
  const buffer: string[] = []
  let is_escaped = false
  let escape_count = 0
  for (let i = 1; i < s.length; i++) {
    const c = s[i]
    if (is_escaped) {
      buffer.push(c)
      is_escaped = false
      continue
    }
    if (c === '\\') {
      is_escaped = true
      escape_count++
      continue
    }
    if (c === '`') {
      const str = buffer.join('')
      s = s.substring(str.length + escape_count + 2)
      return [str, s]
    }
    buffer.push(c)
  }
  return [buffer.join(''), s.slice(1)]
}

function parseStringWithoutQuote(
  s: string,
  e: Error,
  delimiters: string[] = [' '],
): ParseResult<string> {
  const index = Math.min(
    ...delimiters.map(delimiter => {
      const index = s.indexOf(delimiter)
      return index === -1 ? s.length : index
    }),
  )
  const value = s.substring(0, index).trim()
  const rest = s.substring(index)
  return [value, rest]
}

parsers['{'] = parseObject

function parseObject(s: string, e: Error): ParseResult<object> {
  s = s.substr(1) // skip starting '{'
  const acc: any = {}
  s = skipSpace(s)
  for (; s.length > 0; ) {
    if (s[0] === '}') {
      s = s.substr(1) // skip ending '}'
      break
    }

    const keyRes = parseStringCasual(s, e, [':', '}'])
    const key = keyRes[0]
    s = keyRes[1]

    s = skipSpace(s)
    if (s[0] !== ':') {
      acc[key] = undefined
      break
    }
    s = s.substr(1) // skip ':'
    s = skipSpace(s)

    if (s.length === 0) {
      acc[key] = undefined
      break
    }
    const valueRes = parseAny(s, e)
    acc[key] = valueRes[0]
    s = valueRes[1]
    s = skipSpace(s)

    if (s[0] === ',') {
      s = s.substr(1)
      s = skipSpace(s)
    }
  }
  return [acc, s]
}

parsers['t'] = parseTrue

function parseTrue(s: string, e: Error): ParseResult<true> {
  return parseToken(s, `true`, true, e)
}

parsers['f'] = parseFalse

function parseFalse(s: string, e: Error): ParseResult<false> {
  return parseToken(s, `false`, false, e)
}

parsers['n'] = parseNull

function parseNull(s: string, e: Error): ParseResult<null> {
  return parseToken(s, `null`, null, e)
}

function parseToken<T>(
  s: string,
  tokenStr: string,
  tokenVal: T,
  e: Error,
): ParseResult<T> {
  for (let i = tokenStr.length; i >= 1; i--) {
    if (s.startsWith(tokenStr.slice(0, i))) {
      return [tokenVal, s.slice(i)]
    }
  }
  /* istanbul ignore next */
  {
    const prefix = JSON.stringify(s.slice(0, tokenStr.length))
    logError(`unknown token starting with ${prefix}:`, { s })
    throw e
  }
}
