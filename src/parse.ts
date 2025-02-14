type Error = unknown

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
    console.error('parsed json with extra tokens:', {
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
    console.error(`no parser registered for ${JSON.stringify(s[0])}:`, { s })
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
    console.error(`unknown token starting with ${prefix}:`, { s })
    throw e
  }
}
