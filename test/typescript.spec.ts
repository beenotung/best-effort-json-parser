import fs from "fs"
import { expect } from "chai"

describe("ts-mocha setup", () => {
  it("should be able to compile", () => {
    expect(fs.existsSync("package.json")).is.true
    let text = fs.readFileSync("package.json").toString()
    let json = JSON.parse(text)
    expect(json).not.undefined
  });
});

