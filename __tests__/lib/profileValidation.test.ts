import { describe, expect, it } from "@jest/globals";
import {
  PROFILE_NUMBER_RULES,
  ProfileValidationError,
  parseProfileNumber,
} from "@/lib/profileValidation";

const { age, gpa, sat, act, psat } = PROFILE_NUMBER_RULES;

describe("parseProfileNumber", () => {
  it("parses numbers sent as text or as numbers", () => {
    expect(parseProfileNumber("17", "Age", age)).toBe(17);
    expect(parseProfileNumber(17, "Age", age)).toBe(17);
    expect(parseProfileNumber("3.85", "GPA", gpa)).toBe(3.85);
  });

  it.each([undefined, null, "", "  ", "None", "NaN", "null", "undefined"])(
    "treats %p as an unanswered field",
    (blank) => {
      expect(parseProfileNumber(blank, "Age", age)).toBeNull();
    },
  );

  // These are the exact options the onboarding dropdowns send
  it("reads the lower bound of each SAT range", () => {
    const options = ["400-990", "1000-1190", "1200-1390", "1400-1490", "1500+"];

    expect(
      options.map((option) => parseProfileNumber(option, "SAT", sat)),
    ).toEqual([400, 1000, 1200, 1400, 1500]);
  });

  it("reads the lower bound of each ACT range", () => {
    const options = ["1-22", "23-29", "30-33", "34+"];

    expect(
      options.map((option) => parseProfileNumber(option, "ACT", act)),
    ).toEqual([1, 23, 30, 34]);
  });

  it("reads the lower bound of each PSAT range", () => {
    const options = ["320-990", "1000-1190", "1200-1390", "1400+"];

    expect(
      options.map((option) => parseProfileNumber(option, "PSAT", psat)),
    ).toEqual([320, 1000, 1200, 1400]);
  });

  it.each([
    ["abc", "Age", age],
    ["0", "Age", age],
    ["500", "Age", age],
    ["-1", "GPA", gpa],
    ["Infinity", "GPA", gpa],
    ["2000", "SAT", sat],
    ["40", "ACT", act],
  ])("rejects %p for %s", (value, label, rule) => {
    expect(() => parseProfileNumber(value, label, rule)).toThrow(
      ProfileValidationError,
    );
  });

  // The GPA columns are numeric(3,2), so these would overflow in the database
  it.each(["10", "95", "9.995"])("rejects a GPA of %p", (value) => {
    expect(() => parseProfileNumber(value, "GPA", gpa)).toThrow(
      "GPA must be a number between 0 and 9.99",
    );
  });
});
