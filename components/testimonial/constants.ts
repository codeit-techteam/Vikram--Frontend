import { Dimensions } from 'react-native';

export const TESTIMONIAL_CARD_WIDTH = Dimensions.get('window').width - 48;
export const TESTIMONIAL_CARD_GAP = 12;
export const TESTIMONIAL_VIDEO_SNAP = TESTIMONIAL_CARD_WIDTH + TESTIMONIAL_CARD_GAP;

export const REVIEW_CARD_WIDTH = 220;
export const REVIEW_CARD_SNAP = REVIEW_CARD_WIDTH + TESTIMONIAL_CARD_GAP;
