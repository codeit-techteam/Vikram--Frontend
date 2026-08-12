import { Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Leave a peek of the next video card so the carousel feels swipeable. */
export const TESTIMONIAL_CARD_WIDTH = SCREEN_WIDTH - 52;
export const TESTIMONIAL_CARD_GAP = 12;
export const TESTIMONIAL_VIDEO_SNAP = TESTIMONIAL_CARD_WIDTH + TESTIMONIAL_CARD_GAP;

/** Wide enough to read, narrow enough to reveal the next review. */
export const REVIEW_CARD_WIDTH = 248;
export const REVIEW_CARD_SNAP = REVIEW_CARD_WIDTH + TESTIMONIAL_CARD_GAP;
