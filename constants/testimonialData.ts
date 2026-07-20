import type { ImageSourcePropType } from 'react-native';

import { images } from '@constants/images';

export interface TestimonialVideo {
  id: string;
  video: number;
  thumbnail: ImageSourcePropType;
  customerName: string;
  location: string;
  rating: number;
  quote: string;
}

export interface TestimonialReview {
  id: string;
  customerName: string;
  businessType: string;
  rating: number;
  review: string;
  photo?: ImageSourcePropType;
}

export const TESTIMONIAL_VIDEOS: TestimonialVideo[] = [
  {
    id: 'tv1',
    video: require('../assets/videos/landscape.mp4'),
    thumbnail: images.categoryCement,
    customerName: 'Rajesh Mehta',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    quote: 'Cement delivered to our site within 2 hours. Quality was exactly as promised.',
  },
  {
    id: 'tv2',
    video: require('../assets/videos/bricks.mp4'),
    thumbnail: images.categoryBricks,
    customerName: 'Suresh Patil',
    location: 'Pune, Maharashtra',
    rating: 5,
    quote: 'Bulk brick order handled professionally. Saved us two days of procurement.',
  },
  {
    id: 'tv3',
    video: require('../assets/videos/unbeatable.mp4'),
    thumbnail: images.categorySteel,
    customerName: 'Anil Sharma',
    location: 'Delhi NCR',
    rating: 5,
    quote: 'Reliable partner for every project. Materials always arrive on schedule.',
  },
  {
    id: 'tv4',
    video: require('../assets/videos/landscape.mp4'),
    thumbnail: images.categorySand,
    customerName: 'Arjun Rathore',
    location: 'Jodhpur, Rajasthan',
    rating: 5,
    quote:
      'Premium river sand delivered in bulk — fine grain, zero debris. Our plaster finish turned out flawless.',
  },
  {
    id: 'tv5',
    video: require('../assets/videos/landscape.mp4'),
    thumbnail: images.categoryAggregates,
    customerName: 'Deepak Reddy',
    location: 'Hyderabad, Telangana',
    rating: 5,
    quote: 'Bajriwala has transformed how we manage site logistics. Highly recommended.',
  },
];

export const TESTIMONIAL_REVIEWS: TestimonialReview[] = [
  {
    id: 'tr1',
    customerName: 'Arjun Rathore',
    businessType: 'Contractor',
    rating: 5,
    review:
      'Ordered 20 tonnes of river sand for a villa project. Clean, well-graded sand delivered within 3 hours — saved us an entire day of sourcing.',
  },
  {
    id: 'tr2',
    customerName: 'Priya Nair',
    businessType: 'Home Owner',
    rating: 5,
    review: 'Smooth ordering experience. The team helped me choose the right cement grade.',
  },
  {
    id: 'tr3',
    customerName: 'Karan Malhotra',
    businessType: 'Builder',
    rating: 5,
    review: 'Bulk procurement saved us 12% on our last project. Will order again.',
  },
  {
    id: 'tr4',
    customerName: 'Ravi Kumar',
    businessType: 'Contractor',
    rating: 5,
    review: 'Emergency delivery at midnight saved our pour. Bajriwala is a lifesaver.',
  },
  {
    id: 'tr5',
    customerName: 'Neha Gupta',
    businessType: 'Interior Designer',
    rating: 5,
    review: 'Wide product range and transparent pricing. My go-to for all site materials.',
  },
];
