import { useWindowDimensions } from "react-native";

const TABLET_BREAKPOINT = 768;
const MATCH_DECK_TABLET_BREAKPOINT = 700;
const CONTENT_MAX_WIDTH = 920;
const FORM_MAX_WIDTH = 560;
const MODAL_MAX_WIDTH = 680;
const MATCH_CARD_MAX_WIDTH = 760;
const MATCH_CARD_MAX_HEIGHT = 820;

export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const isMatchDeckTablet = width >= MATCH_DECK_TABLET_BREAKPOINT;
  const isLandscape = width > height;
  const tabletContentMaxWidth = isLandscape ? 1080 : CONTENT_MAX_WIDTH;
  const contentMaxWidth = isTablet
    ? Math.min(width - 48, tabletContentMaxWidth)
    : width;
  const tabletMatchCardWidth = isLandscape
    ? Math.min(width - 220, MATCH_CARD_MAX_WIDTH)
    : Math.min(width - 84, 680);
  const tabletMatchCardHeight = isLandscape
    ? Math.min(Math.max(height - 170, 520), 650)
    : Math.min(
        Math.max(height - 250, 640),
        MATCH_CARD_MAX_HEIGHT,
      );
  const matchCardHorizontalMargin = isTablet
    ? Math.max((width - tabletMatchCardWidth) / 2, 24)
    : 20;

  return {
    width,
    height,
    isTablet,
    isMatchDeckTablet,
    isLandscape,
    contentMaxWidth,
    formMaxWidth: isTablet ? Math.min(width - 48, FORM_MAX_WIDTH) : width,
    modalMaxWidth: isTablet ? Math.min(width - 32, MODAL_MAX_WIDTH) : width,
    matchCardWidth: isMatchDeckTablet ? tabletMatchCardWidth : width - 40,
    matchCardHeight: isMatchDeckTablet ? tabletMatchCardHeight : 600,
    matchCardHorizontalMargin: isMatchDeckTablet
      ? Math.max((width - tabletMatchCardWidth) / 2, 24)
      : 20,
    matchTopOffset: isMatchDeckTablet ? (isLandscape ? 210 : 190) : 130,
    matchCardVerticalMargin: isMatchDeckTablet
      ? (isLandscape ? 18 : 12)
      : 20,
  };
};
