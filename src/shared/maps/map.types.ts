import type { StyleProp, ViewStyle } from 'react-native';
import type { Region } from 'react-native-maps';

export interface MapLatLng {
  latitude: number;
  longitude: number;
}

export type MapMarkerKind =
  | 'source'
  | 'destination'
  | 'driver'
  | 'passenger'
  | 'pickup'
  | 'drop'
  | 'user'
  | 'custom';

export interface BhaiWayMapMarker {
  id: string;
  coordinate: MapLatLng;
  kind?: MapMarkerKind;
  title?: string;
  description?: string;
  pinColor?: string;
}

export interface BhaiWayMapProps {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  markers?: readonly BhaiWayMapMarker[];
  routeCoordinates?: readonly MapLatLng[];
  /** Extra coordinates included in auto-fit (e.g. alternative route polylines). */
  extraFitCoordinates?: readonly MapLatLng[];
  autoFit?: boolean;
  edgePadding?: { top: number; right: number; bottom: number; left: number };
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  liteMode?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  bypassTitle?: string;
  bypassSubtitle?: string;
  onMapReady?: () => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
}

export interface DeviceLocationState {
  coordinate: MapLatLng | null;
  /** Degrees clockwise from north when GPS provides it; otherwise null. */
  heading: number | null;
  /** Meters per second when GPS provides it; otherwise null. */
  speed: number | null;
  permission: 'granted' | 'denied' | 'denied_forever' | 'services_off' | 'unavailable' | 'pending';
  errorMessage: string | null;
  watching: boolean;
}
