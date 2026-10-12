import { describe, expect, it } from "@jest/globals";
import { formatDateToYMD, renderStars } from "@/lib/formatters";

describe("renderStars", () => {
  it("fills one star per point", () => {
    expect(renderStars(3)).toBe("★★★☆☆");
  });

  it("rounds to the nearest star", () => {
    expect(renderStars(3.6)).toBe("★★★★☆");
  });

  it("shows N/A when there is no rating", () => {
    expect(renderStars(undefined)).toBe("N/A");
  });

  it("stays within five stars for an out-of-range rating", () => {
    expect(renderStars(9)).toBe("★★★★★");
    expect(renderStars(-2)).toBe("☆☆☆☆☆");
  });
});

describe("formatDateToYMD", () => {
  it("pads the month and day", () => {
    expect(formatDateToYMD(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("uses the local date, not the UTC date", () => {
    // 11:30 pm local time is already the next day in UTC for zones behind it
    expect(formatDateToYMD(new Date(2026, 11, 31, 23, 30))).toBe("2026-12-31");
  });

  it("throws on an invalid date", () => {
    expect(() => formatDateToYMD(new Date("not a date"))).toThrow(
      "Invalid date",
    );
  });
});
