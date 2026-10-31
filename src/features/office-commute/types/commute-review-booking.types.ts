export interface CommuteRideAlong {
  id: string;
  name: string;
  rating: number;
  verificationLabel: string;
  seatLabel: string;
  verified: boolean;
  avatarUri?: string;
}

export interface CommuteBookingFare {
  riderPricePerSeat: number;
  seats: number;
  total: number;
}

export interface CommuteReviewBookingData {
  rideId: string;
  driverName: string;
  driverAvatarUri?: string;
  carModel: string;
  distanceLabel: string;
  durationLabel: string;
  matchPercent: number | null;
  matchCaption: string;
  riderPricePerSeat: number;
  availableSeats: number;
  pickup: {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  rideAlongs: CommuteRideAlong[];
  fare: CommuteBookingFare;
}
