import sinon from 'sinon'
import { expect } from 'chai'
import { parse } from './parse'

describe('parser TestSuit', function () {
  context('number', () => {
    it('should parse positive integer', function () {
      expect(parse(`42`)).equals(42)
    })
    it('should parse negative integer', function () {
      expect(parse(`-42`)).equals(-42)
    })

    it('should parse positive float', function () {
      expect(parse(`12.34`)).equals(12.34)
    })
    it('should parse negative float', function () {
      expect(parse(`-12.34`)).equals(-12.34)
    })

    it('should parse incomplete positive float', function () {
      expect(parse(`12.`)).equals(12)
    })
    it('should parse incomplete negative float', function () {
      expect(parse(`-12.`)).equals(-12)
    })
    it('should parse incomplete negative integer', function () {
      expect(parse(`-`)).equals(-0)
    })

    it('should preserve invalid number', function () {
      expect(parse(`1.2.3.4`)).equals('1.2.3.4')
    })
  })

  context('string', () => {
    it('should parse string', function () {
      expect(parse(`"I am text"`)).equals('I am text')
      expect(parse(`"I'm text"`)).equals("I'm text")
      expect(parse(`"I\\"m text"`)).equals('I"m text')
    })
    it('should parse incomplete string', function () {
      expect(parse(`"I am text`)).equals('I am text')
      expect(parse(`"I'm text`)).equals("I'm text")
      expect(parse(`"I\\"m text`)).equals('I"m text')
    })
  })

  context('boolean', () => {
    it('should parse boolean', function () {
      expect(parse(`true`)).equals(true)
      expect(parse(`false`)).equals(false)
    })

    function testIncomplete(str: string, val: boolean) {
      for (let i = str.length; i >= 1; i--) {
        expect(parse(str.slice(0, i))).equals(val)
      }
    }

    it('should parse incomplete true', function () {
      testIncomplete(`true`, true)
    })
    it('should parse incomplete false', function () {
      testIncomplete(`false`, false)
    })
  })

  context('array', () => {
    it('should parse empty array', function () {
      expect(parse(`[]`)).deep.equals([])
    })
    it('should parse number array', function () {
      expect(parse(`[1,2,3]`)).deep.equals([1, 2, 3])
    })
    it('should parse incomplete array', function () {
      expect(parse(`[1,2,3`)).deep.equals([1, 2, 3])
      expect(parse(`[1,2,`)).deep.equals([1, 2])
      expect(parse(`[1,2`)).deep.equals([1, 2])
      expect(parse(`[1,`)).deep.equals([1])
      expect(parse(`[1`)).deep.equals([1])
      expect(parse(`[`)).deep.equals([])
    })
  })

  context('object', () => {
    it('should parse simple object', function () {
      let o = { a: 'apple', b: 'banana' }
      expect(parse(JSON.stringify(o))).deep.equals(o)
      expect(parse(JSON.stringify(o, null, 2))).deep.equals(o)
      expect(parse(`{"a":"apple","b":"banana"}`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{"a": "apple","b": "banana"}`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{"a": "apple", "b": "banana"}`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{"a" : "apple", "b" : "banana"}`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{ "a" : "apple", "b" : "banana" }`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{ "a" : "apple" , "b" : "banana" }`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
    })
    it('should parse incomplete simple object', function () {
      expect(parse(`{"a":"apple","b":"banana"`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{"a":"apple","b":"banana`)).deep.equals({
        a: 'apple',
        b: 'banana',
      })
      expect(parse(`{"a":"apple","b":"b`)).deep.equals({ a: 'apple', b: 'b' })
      expect(parse(`{"a":"apple","b":"`)).deep.equals({ a: 'apple', b: '' })
      expect(parse(`{"a":"apple","b":`)).deep.equals({
        a: 'apple',
        b: undefined,
      })
      expect(parse(`{"a":"apple","b"`)).deep.equals({
        a: 'apple',
        b: undefined,
      })
      expect(parse(`{"a":"apple","b`)).deep.equals({ a: 'apple', b: undefined })
      expect(parse(`{"a":"apple","`)).deep.equals({ a: 'apple', '': undefined })
      expect(parse(`{"a":"apple",`)).deep.equals({ a: 'apple' })
      expect(parse(`{"a":"apple"`)).deep.equals({ a: 'apple' })
      expect(parse(`{"a":"apple`)).deep.equals({ a: 'apple' })
      expect(parse(`{"a":"a`)).deep.equals({ a: 'a' })
      expect(parse(`{"a":"`)).deep.equals({ a: '' })
      expect(parse(`{"a":`)).deep.equals({ a: undefined })
      expect(parse(`{"a"`)).deep.equals({ a: undefined })
      expect(parse(`{"a`)).deep.equals({ a: undefined })
      expect(parse(`{"`)).deep.equals({ '': undefined })
      expect(parse(`{`)).deep.equals({})
    })
  })

  context('complex object', () => {
    it('should parse complete complex object', function () {
      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,
          "float": 12.34
        }
      }
}`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
            float: 12.34,
          },
        },
      })
    })
    it('should parse incomplete complex object', function () {
      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,
          "float": 12.34
        }
      }`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
            float: 12.34,
          },
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,
          "float": 12.34
        }`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
            float: 12.34,
          },
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,
          "float": 12.34`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
            float: 12.34,
          },
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,
          "float": 12.`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
            float: 12,
          },
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,
          "float":`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
            float: undefined,
          },
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {
          "int": 42,`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {
            int: 42,
          },
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj": {`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: {},
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
        "obj":`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
          obj: undefined,
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], { "int": 42, "flo`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], { int: 42, flo: undefined }],
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 12.34], {`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 12.34], {}],
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [42, 12.34, [42, 1`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [42, 12.34, [42, 1]],
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float": 12.34,
        "arr": [`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: 12.34,
          arr: [],
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "float": 12.34 }],
      "obj": {
        "int": 42,
        "float"`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, float: 12.34 }],
        obj: {
          int: 42,
          float: undefined,
        },
      })

      expect(
        parse(`{
      "int": 42,
      "float": 12.34,
      "arr": [42, 12.34, [42, 12.34], { "int": 42, "flo`),
      ).deep.equals({
        int: 42,
        float: 12.34,
        arr: [42, 12.34, [42, 12.34], { int: 42, flo: undefined }],
      })
    })
  })

  context('invalid inputs', () => {
    it('should throw error on invalid (not incomplete) json text', function () {
      let spy = sinon.fake()
      let error = console.error
      console.error = spy
      expect(() => parse(`:atom`)).to.throws()
      expect(spy.called).be.true
      expect(spy.firstCall.firstArg).is.string('no parser registered')
      console.error = error
    })
    it('should complaint on extra tokens', function () {
      // let spy = sinon.fake()
      // parse.onExtraToken = spy
      let spy = sinon.spy(parse, 'onExtraToken')
      expect(parse(`[1] 2`)).deep.equals([1])
      expect(spy.called).be.true
      expect(parse.lastParseReminding).equals(' 2')
    })
  })

  context('extra space', () => {
    it('should parse complete json with extra space', function () {
      expect(parse(` [1] `)).deep.equals([1])
    })
    it('should parse incomplete json with extra space', function () {
      expect(parse(` [1 `)).deep.equals([1])
    })
  })

  context('invalid but understandable json', () => {
    it('should parse escaped newline', function () {
      expect(parse(`"line1\\nline2"`)).equals('line1\nline2')
    })
    it('should parse non-escaped newline', function () {
      expect(parse(`"line1\nline2"`)).equals('line1\nline2')
    })
  })
})
