import type { ImageSourcePropType } from 'react-native';
import type { ServiceCardData } from '../../types';

export type ServiceCardLayout = 'featured' | 'compact';

export interface ServiceCardProps {
  data: ServiceCardData;
  index: number;
  layout?: ServiceCardLayout;
  illustration?: ImageSourcePropType;
  onPress: (data: ServiceCardData) => void;
}
