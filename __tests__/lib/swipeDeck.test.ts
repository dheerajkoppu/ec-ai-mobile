import { describe, expect, it } from "@jest/globals";
import { buildDeck } from "@/lib/swipeDeck";

const opportunities = [0, 1, 2, 3, 4, 5, 6].map((id) => ({ id }));

const layout = (showAds: boolean) =>
  buildDeck(opportunities, showAds).map((card) =>
    card.kind === "ad" ? "ad" : card.opportunity.id,
  );

describe("buildDeck", () => {
  it("puts an ad in every third position for free users", () => {
    expect(layout(true)).toEqual([0, 1, "ad", 2, 3, "ad", 4, 5, "ad", 6]);
  });

  it("keeps every opportunity, in order, when ads are shown", () => {
    const shown = layout(true).filter((card) => card !== "ad");

    expect(shown).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("shows no ads for premium users", () => {
    expect(layout(false)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("never ends the deck on an ad", () => {
    for (let count = 1; count <= 12; count += 1) {
      const deck = buildDeck(opportunities.slice(0, count), true);

      expect(deck[deck.length - 1].kind).toBe("opportunity");
    }
  });

  it("returns an empty deck when there are no opportunities", () => {
    expect(buildDeck([], true)).toEqual([]);
  });
});
