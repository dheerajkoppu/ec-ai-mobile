const AD_INTERVAL = 3;

export type DeckCard<T> =
  | { kind: "opportunity"; opportunity: T }
  | { kind: "ad" };

/**
 * Builds the swipe deck. With ads on, every third card is an ad placed between
 * opportunities, so an ad never takes the place of one.
 */
export function buildDeck<T>(
  opportunities: T[],
  showAds: boolean,
): DeckCard<T>[] {
  const deck: DeckCard<T>[] = [];

  for (const opportunity of opportunities) {
    if (showAds && (deck.length + 1) % AD_INTERVAL === 0) {
      deck.push({ kind: "ad" });
    }
    deck.push({ kind: "opportunity", opportunity });
  }

  return deck;
}
