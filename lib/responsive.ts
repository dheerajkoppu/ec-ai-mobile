import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Low enough that the iPhone Duo's inner display (669 pt wide) gets the tablet layout
const TABLET_BREAKPOINT = 640;
const CONTENT_MAX_WIDTH = 920;
const FORM_MAX_WIDTH = 560;
const MODAL_MAX_WIDTH = 680;
const MATCH_CARD_MAX_WIDTH = 760;
const MATCH_CARD_MAX_HEIGHT = 820;
const PHONE_MATCH_CARD_HEIGHT = 600;
const MIN_MATCH_CARD_HEIGHT = 240;
// Room for the stacked cards that peek out below the top card
const MATCH_DECK_BOTTOM_GAP = 8;

/** Layout sizes for the current window, so screens adapt to tablets, landscape and folding phones. */
export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  // Inside a tab screen this includes the tab bar
  const {
    bottom: bottomInset,
    left: leftInset,
    right: rightInset,
  } = useSafeAreaInsets();
  // The folded iPhone Duo keeps its right edge for the status bar and a tab rail
  const deckWidth = width - leftInset - rightInset;
  const isTablet = width >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  const tabletContentMaxWidth = isLandscape ? 1080 : CONTENT_MAX_WIDTH;
  const contentMaxWidth = isTablet
    ? Math.min(width - 48, tabletContentMaxWidth)
    : width;
  const tabletMatchCardWidth = isLandscape
    ? Math.min(deckWidth - 220, MATCH_CARD_MAX_WIDTH)
    : Math.min(deckWidth - 84, 680);
  const matchCardWidth = isTablet ? tabletMatchCardWidth : deckWidth - 40;
  const tabletMatchCardHeight = isLandscape
    ? Math.min(Math.max(height - 170, 520), 650)
    : Math.min(Math.max(height - 250, 640), MATCH_CARD_MAX_HEIGHT);
  const matchTopOffset = isTablet ? (isLandscape ? 210 : 190) : 130;
  const matchCardVerticalMargin = isTablet && isLandscape ? 18 : 20;
  // The swiper ignores the screen's padding, so the deck starts this far from the top of the window
  const matchDeckHeight =
    height -
    matchTopOffset -
    matchCardVerticalMargin -
    bottomInset -
    MATCH_DECK_BOTTOM_GAP;
  const matchCardHeight = Math.max(
    Math.min(
      isTablet ? tabletMatchCardHeight : PHONE_MATCH_CARD_HEIGHT,
      matchDeckHeight,
    ),
    MIN_MATCH_CARD_HEIGHT,
  );

  return {
    width,
    height,
    isTablet,
    isLandscape,
    contentMaxWidth,
    formMaxWidth: isTablet ? Math.min(width - 48, FORM_MAX_WIDTH) : width,
    modalMaxWidth: isTablet ? Math.min(width - 32, MODAL_MAX_WIDTH) : width,
    matchCardWidth,
    matchCardHeight,
    matchCardLeft: leftInset + (deckWidth - matchCardWidth) / 2,
    matchTopOffset,
    matchCardVerticalMargin,
  };
};
