export const ENDPOINTS = {
  auth: {
    requestOtp: '/auth/otp/request',
    verifyOtp: '/auth/otp/verify',
    /** Exchange MSG91 widget access-token for BhaiWay JWT. */
    msg91Verify: '/auth/msg91/verify',
  },
  users: {
    /** Authenticated user + profile (Bearer JWT). */
    me: '/users/me',
    /** Create profile after MSG91 → BhaiWay JWT (Bearer JWT). */
    profile: '/users/profile',
  },
  home: {
    dashboard: '/home/dashboard',
  },
  media: {
    /** Persist Cloudinary secure_url + public_id after client upload. */
    saveAsset: '/media/assets',
    /** Backend-signed Cloudinary destroy. */
    deleteAsset: '/media/cloudinary/delete',
  },
  vehicles: {
    /** List vehicles for the authenticated user (Bearer JWT). */
    list: '/vehicles',
    /** Create / register a vehicle with RC Cloudinary URL. */
    create: '/vehicles',
    byId: (id: string) => `/vehicles/${id}`,
    activate: (id: string) => `/vehicles/${id}/activate`,
  },
  verification: {
    /** Current user verification statuses (Bearer JWT). */
    me: '/verification/me',
    /** Submit identity verification metadata (Bearer JWT). */
    identity: '/verification/identity',
    /** Submit driving-license verification metadata (Bearer JWT). */
    drivingLicense: '/verification/driving-license',
    /** Submit vehicle verification metadata (Bearer JWT). */
    vehicle: '/verification/vehicle',
  },
  rides: {
    /** Publish a ride (Bearer JWT). Driver/status/availableSeats are server-controlled. */
    create: '/rides',
    /** Search published rides for passengers (Bearer JWT). */
    search: '/rides/search',
    /** Rides owned by the authenticated driver (Bearer JWT). */
    my: '/rides/my',
    byId: (id: string) => `/rides/${id}`,
  },
} as const;
