export const COMMUTE_RIDE_BOOKED_SCREEN = {
  titlePending: 'Ride requested successfully',
  subtitlePending:
    'Your payment has been received. Waiting for the driver to accept your request.',
  titleConfirmed: 'Ride confirmed',
  subtitleConfirmed: 'Your driver has accepted your Commute request.',
  messageLabel: 'Message',
  callLabel: 'Call',
  pickupLabel: 'Pickup',
  dropoffLabel: 'Drop-off',
  seatsLabel: 'Seats',
  paidLabel: 'Paid',
  statusPending: 'Waiting for driver acceptance',
  statusConfirmed: 'Confirmed',
  trackLabel: 'Track My Ride',
  optionsLabel: 'Ride Options',
  etaBadge: (minutes: number) => {
    const safe = Math.max(1, Math.round(minutes));
    return safe === 1 ? '1 min away' : `${safe} mins away`;
  },
  defaultDateLabel: 'Today',
  defaultTimeLabel: '—',
  defaultVehicle: 'Vehicle',
  defaultDriverName: 'Driver',
  defaultDriverRating: 4.8,
  defaultPickupTitle: 'Pickup',
  defaultPickupAddress: '',
  defaultDropoffTitle: 'Drop-off',
  defaultDropoffAddress: '',
  driverEtaMinutes: 4,
  driverAvatarUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBhD36Er5tosGGN0-zxVWGJVlY2fYnAme9Z8HF-K8IaGUnGlbalofSLuYZnoTpVPh9vPWtgdqk4gmUhcuCmGG6xQXNcCePEF8eBZm7UowA1pwQOsLkL_1JOz13zZK_PZQHoGdDIWZHQ7dUjaAsmked1pIKWQhFowaeSRACE3_GEmJomoivg--qFGMqY0oDVQBa_5gHmdpaVxxlwOE-rgwPjD0f5UnMGq0I1uyLm0BOEj20COctRUWs64zhBVrPg5-uWW4FoizgrbJA',
  mapImageUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCYk3XR84y_P9jDuGa_-X7iIVTGCImy8fMbFpNRcUzbr-H5Obk8HSFSlJlB-NDu0nNZKnBDb0saxQBi3ww-rW7WkZcJ-lpY5qtTrmuxH77B5XhQS-w_Fr0SUKcDQMBCiXzQon-jiafOmesgJc8hGtov86eFZUpmbNA99taVjL0GDjskyDQGBxtd27ctErs8uJBTSs8vZZVz176p0DKuZHRCh-r40ZgYHS3L71x0NayhzAi7Ezj4H8SN4Nn2x45FHUQaTyasbTgafDc',
} as const;

export const getCommuteRideBookedPath = (params: {
  rideId: string;
  bookingId?: string;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  seats?: number;
  status?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/office-commute/booked' as const,
  params: {
    rideId: params.rideId,
    bookingId: params.bookingId ?? '',
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    price: params.price != null ? String(params.price) : '',
    seats: params.seats != null ? String(params.seats) : '1',
    status: params.status ?? 'PENDING',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});
