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
})
