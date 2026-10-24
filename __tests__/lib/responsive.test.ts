import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useResponsiveLayout } from "@/lib/responsive";

const mockWindow = jest.fn<() => { width: number; height: number }>();
const mockInsets =
  jest.fn<() => { bottom: number; left: number; right: number }>();

jest.mock("react-native", () => ({
  useWindowDimensions: () => mockWindow(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets(),
}));

// Bottom insets inside a tab screen include the tab bar: 34 home indicator + 49 tab bar on iPhone
const devices = {
  iPhonePro: { width: 402, height: 874, bottomInset: 83 },
  duoOuter: { width: 466, height: 678, bottomInset: 83 },
  duoInner: { width: 669, height: 951, bottomInset: 83 },
  iPadPortrait: { width: 834, height: 1194, bottomInset: 20 },
};

type Device = {
  width: number;
  height: number;
  bottomInset: number;
  rightInset?: number;
};

const layoutFor = ({ width, height, bottomInset, rightInset = 0 }: Device) => {
  mockWindow.mockReturnValue({ width, height });
  mockInsets.mockReturnValue({
    bottom: bottomInset,
    left: 0,
    right: rightInset,
  });
  // Both hooks it calls are mocked, so it can run outside a component
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useResponsiveLayout();
};

describe("useResponsiveLayout", () => {
  beforeEach(() => {
    mockWindow.mockReset();
    mockInsets.mockReset();
  });

  it("keeps the full size card on a regular iPhone", () => {
    const layout = layoutFor(devices.iPhonePro);

    expect(layout.isTablet).toBe(false);
    expect(layout.matchCardWidth).toBe(362);
    expect(layout.matchCardHeight).toBe(600);
    expect(layout.matchCardLeft).toBe(20);
  });

  it("keeps the card clear of the folded iPhone Duo's right edge", () => {
    const layout = layoutFor({ ...devices.duoOuter, rightInset: 56 });

    expect(layout.matchCardWidth).toBe(370);
    expect(layout.matchCardLeft).toBe(20);
    expect(layout.matchCardLeft + layout.matchCardWidth).toBe(466 - 56 - 20);
  });

  it("shortens the card to fit the iPhone Duo outer display", () => {
    const layout = layoutFor(devices.duoOuter);

    expect(layout.isTablet).toBe(false);
    expect(layout.matchCardWidth).toBe(426);
    expect(layout.matchCardHeight).toBe(437);
  });

  it("uses the tablet layout on the iPhone Duo inner display", () => {
    const layout = layoutFor(devices.duoInner);

    expect(layout.isTablet).toBe(true);
    expect(layout.formMaxWidth).toBe(560);
    expect(layout.matchCardWidth).toBe(585);
    expect(layout.matchCardHeight).toBe(650);
    expect(layout.matchCardLeft).toBe(42);
  });

  it("keeps the iPad portrait card unchanged", () => {
    const layout = layoutFor(devices.iPadPortrait);

    expect(layout.matchCardWidth).toBe(680);
    expect(layout.matchCardHeight).toBe(820);
  });

  it("keeps the card above the tab bar on every device", () => {
    for (const device of Object.values(devices)) {
      const layout = layoutFor(device);
      const cardBottom =
        layout.matchTopOffset +
        layout.matchCardVerticalMargin +
        layout.matchCardHeight;

      expect(cardBottom).toBeLessThanOrEqual(
        device.height - device.bottomInset,
      );
    }
  });

  it("switches to the tablet layout at 640 pt", () => {
    expect(
      layoutFor({ width: 639, height: 951, bottomInset: 83 }).isTablet,
    ).toBe(false);
    expect(
      layoutFor({ width: 640, height: 951, bottomInset: 83 }).isTablet,
    ).toBe(true);
  });

  it("never shrinks the card below its minimum height", () => {
    const layout = layoutFor({ width: 466, height: 420, bottomInset: 83 });

    expect(layout.matchCardHeight).toBe(240);
  });
});
