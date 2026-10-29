import type { HomeAction, HomeCategory } from '../../types';

export interface HomeCategoryCardProps {
  category: HomeCategory;
  index: number;
  onActionPress: (action: HomeAction, category: HomeCategory) => void;
}
