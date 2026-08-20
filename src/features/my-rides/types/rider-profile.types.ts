export interface RiderProfileMutualConnection {
  id: string;
  avatarUri: string;
}

export interface RiderProfileSummary {
  riderId: string;
  rideId: string;
  name: string;
  avatarUri: string;
  verified: boolean;
  verifiedEmployee: boolean;
  company: string;
  companyLogoUri: string;
  jobTitle: string;
  trustScorePercent: number;
  ridesLabel: string;
  rating: number;
  memberSinceMonth: string;
  memberSinceYear: string;
  preferences: readonly string[];
  mutualConnections: readonly RiderProfileMutualConnection[];
  feedbackQuote: string;
  feedbackAuthor: string;
  seatsBooked: number;
}
