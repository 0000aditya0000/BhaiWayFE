export interface RouteOptionCardProps {
  title: string;
  distanceLabel: string;
  durationLabel: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}
