import { expect, it } from "bun:test";
import { equationValues } from "../../src/lib/explanations/model.ts";
import { formattedFormulaTokens, formulaTokens } from "../../src/lib/explanations/presentation.ts";

it("keeps unary formula signs and scientific notation attached to their numeric value", () => {
  const source = equationValues({ negative: -20, tiny: -1e-7, large: 1e21 });
  expect(source).toBe("negative = -20\ntiny = -1e-7\nlarge = 1e+21");
  expect(formattedFormulaTokens(source).filter(({ kind }) => kind === "value")).toEqual([
    { kind: "value", text: "-20" },
    { kind: "value", text: "-1e-7" },
    { kind: "value", text: "1e+21" },
  ]);
});

it("distinguishes unary formula numbers from subtraction without changing formula text", () => {
  for (const [source, numbers] of [
    ["-20", ["-20"]],
    ["  -20", ["-20"]],
    ["x = +20", ["+20"]],
    ["x = a - 20", ["20"]],
    ["x = a-20", ["20"]],
    ["x = (a) -20", ["20"]],
    ["x = a[0] -20", ["0", "20"]],
    ["x = 30 -20", ["30", "20"]],
    ["x = a - -20", ["-20"]],
    ["x = a * -20", ["-20"]],
    ["x = max(-20, +2.5)", ["-20", "+2.5"]],
    ["x = [-20, 2E-7]", ["-20", "2E-7"]],
    ['x = "-20" # -30', ['"-20"']],
  ] satisfies [string, string[]][]) {
    const tokens = formulaTokens(source);
    expect(tokens.map(({ text }) => text).join("")).toBe(source);
    expect(tokens.filter(({ kind }) => kind === "value").map(({ text }) => text)).toEqual(numbers);
  }
});
