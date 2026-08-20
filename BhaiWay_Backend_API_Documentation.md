# BhaiWay Backend API Documentation

**Environment:** Staging  
**Base URL:** `https://bhaiway-backend.onrender.com`  
**Swagger UI:** `https://bhaiway-backend.onrender.com/api/docs`  
**Swagger JSON:** `https://bhaiway-backend.onrender.com/api/docs-json`  
**Authentication:** JWT Bearer for protected endpoints

> **Important:** Swagger/OpenAPI is the authoritative API contract for exact field names, enum values, validation constraints, and response schemas. This document is a frontend-friendly companion with endpoint purpose, representative request/response examples, business rules, and integration notes.

---

## 1. Authentication

### `POST /auth/msg91/verify`

Verifies the access token returned by the MSG91 mobile/widget flow and issues a BhaiWay authentication session/JWT.

**Auth required:** No

**Request**
```json
{
  "accessToken": "<MSG91_ACCESS_TOKEN>"
}
```

**Backend flow**
1. Frontend/mobile app completes OTP verification using MSG91 SDK.
2. MSG91 SDK provides its access token.
3. Frontend sends that token to BhaiWay.
4. BhaiWay verifies it server-side with MSG91.
5. Verified phone is used to find/create the BhaiWay user.
6. BhaiWay returns its own JWT/session response.

**Response:** Use the `AuthResponseDto` shown in Swagger. The response contains the BhaiWay authentication token(s) and user information.

> Never send `MSG91_AUTHKEY` to the frontend. The MSG91 authkey is server-side only.

### `POST /auth/dev/login`

Development-only authentication bypass.

**Auth required:** No

**Production/staging:** `DEV_AUTH_ENABLED=false` is recommended.

Use Swagger for the exact request DTO and response.

---

## 2. Users / Profile

### `GET /users/me`

Returns the authenticated user and profile state.

**Auth:** Bearer JWT

**Response**
```json
{
  "user": { "...": "user fields" },
  "profile": { "...": "profile fields" },
  "profileCompleted": true
}
```

`profile` may be `null`. `profileCompleted` is computed from the required profile state; currently it is true when `firstName` is present.

### `POST /users/profile`

Creates the authenticated user's profile.

**Auth:** Bearer JWT

**Representative request**
```json
{
  "firstName": "Aditya",
  "lastName": "Gangwar",
  "gender": "MALE",
  "dateOfBirth": "2000-01-01" -- not needed
}
```

`firstName` is required on create. Gender is enum validated and `dateOfBirth` is an ISO date string.

**Responses**
- `201` profile created
- `400` validation / non-whitelisted field
- `401` unauthenticated
- `409` profile already exists

### `PATCH /users/profile`

Partially updates profile fields.

**Auth:** Bearer JWT

**Representative request**
```json
{
  "firstName": "Aditya",
  "lastName": "Gangwar",
  "gender": "MALE",
  "dateOfBirth": "2000-01-01"
}
```

Only profile fields are accepted. Fields such as `phone`, `userId`, `status`, wallet fields, etc. are rejected.

---

## 3. Vehicles

### `POST /vehicles`

Creates a vehicle owned by the authenticated user.

**Auth:** Bearer JWT

**Representative request**
```json
{
  "vehicleType": "CAR",
  "make": "Maruti",
  "model": "Swift",
  "variant": "VXI",
  "registrationNumber": "UP32AB1234",
  "registrationYear": 2024
}
```

Registration number is normalized by the backend (trim/uppercase/space normalization).

### `GET /vehicles` --- immplemented

Lists vehicles owned by the authenticated user.

**Auth:** Bearer JWT

**Response:** Array/list of the authenticated user's vehicles.

### `GET /vehicles/:id`

Returns one owned vehicle.

**Auth:** Bearer JWT

Foreign vehicle IDs are protected by ownership checks.

### `PATCH /vehicles/:id`

Updates an owned vehicle.

**Auth:** Bearer JWT

`isActive` is not directly patchable.

Material vehicle changes can invalidate the current vehicle verification and require resubmission.

### `DELETE /vehicles/:id`

Soft-deletes an owned vehicle.

**Auth:** Bearer JWT

### `POST /vehicles/:id/activate`

Activates an owned vehicle.

**Auth:** Bearer JWT

---

## 4. Identity & Verification

### `GET /verification/me`

Returns the authenticated user's verification state.

**Auth:** Bearer JWT

Verification types:
- `IDENTITY`
- `DRIVING_LICENSE`
- `VEHICLE`

Statuses:
- `PENDING`
- `IN_REVIEW`
- `VERIFIED`
- `REJECTED`
- `EXPIRED`

### `POST /verification/identity` -- testing pending

Submits identity verification metadata.

**Auth:** Bearer JWT

**Representative request**
```json
{
  "documentUrl": "<document-url>",
  "documentType": "<document-type>",
  "documentReference": "<reference>"
}
```


Submits driving-license verification metadata.

**Auth:** Bearer JWT

**Representative request**
```json
{
  "documentUrl": "<document-url>",
  "documentType": "<document-type>",
  "documentReference": "<reference>"
}
```

### `POST /verification/vehicle`

Submits vehicle verification metadata.

**Auth:** Bearer JWT

**Representative request**
```json
{
  "documentUrl": "<document-url>",
  "documentType": "<document-type>",
  "documentReference": "<reference>"
}
```

> Verification is intentionally provider-abstracted. The current implementation has a stub provider; real KYC/identity provider integration is a later phase.

### Verification eligibility

Publishing a ride requires:
- identity = `VERIFIED`
- driving license = `VERIFIED`
- vehicle = `VERIFIED`
- selected vehicle owned, active and not deleted

Booking requires identity = `VERIFIED`.

---

## 5. Rides

### `POST /rides`

Publishes a ride.

**Auth:** Bearer JWT

**Ride types**
- `REGULAR`
- `ASSURED`

**Representative request**
```json
{
  "vehicleId": "<vehicle-id>",
  "source": "Noida",
  "destination": "Delhi",
  "departureDate": "2026-08-20",
  "departureTime": "09:00",
  "seats": 4,
  "pricePerSeat": 500,
  "rideType": "REGULAR"
}
```

The actual Swagger DTO may include additional ride preference/note fields.

**Rules**
- Driver comes from JWT; client cannot set `driverId`.
- Client cannot set `status` or `availableSeats`.
- Driver must be ACTIVE.
- Driver must satisfy verification eligibility.
- Vehicle must be owned/active.
- Price uses integer Points; 1 Point = ₹1.
- Departure date/time are stored as civil date/local wall-clock values.

### Assured ride deposit

For `rideType=ASSURED`:
- Admin-configured deposit percentage defaults to **5%**.
- Driver deposit = `publishedSeats × pricePerSeat × percentage / 100`.
- Example: 4 seats × ₹500 = ₹2,000 fare → 5% = **₹100 driver deposit**.
- Deposit percentage is snapshotted on the ride.
- Deposit is held in the wallet; it is not fare payment.

### `GET /rides/search`

Searches published rides.

**Auth:** Bearer JWT

**Query parameters**
- `source`
- `destination`
- `date`
- `time` (optional)
- `seats` (optional)
- `rideType` (optional)
- `page` (default 1)
- `limit` (default 20, max 50)

**Rules**
- Only `PUBLISHED` rides.
- Source/destination: trimmed, case-insensitive contains match.
- Exact departure date.
- If time supplied: departure time >= requested time.
- If seats supplied: available seats >= requested seats.
- Sorted by departure date/time/created time ascending.

**Response**
```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0
}
```

### `GET /rides/my`

Lists rides owned by the authenticated driver.

**Auth:** Bearer JWT

### `GET /rides/:id`

Owner-only ride detail.

**Auth:** Bearer JWT

### `GET /rides/public/:id`

Passenger-facing safe ride detail.

**Auth:** Bearer JWT

Only published rides are exposed. Safe driver/vehicle information is returned; internal wallet/hold IDs are not exposed.

### `PATCH /rides/:id`

Updates an owned ride.

**Auth:** Bearer JWT

Client cannot directly set ride status, driver, or available seats.

For an Assured ride, price/seat changes that would conflict with an active driver deposit hold are blocked.

### `POST /rides/:id/complete`

Completes a ride.

**Auth:** Bearer JWT; owning driver only.

**Effect**
- `PUBLISHED → COMPLETED`
- Eligible bookings become `COMPLETED`
- Active Assured deposits are released atomically
- Repeating the request is idempotent

### `POST /rides/:id/cancel`

Cancels a ride before departure.

**Auth:** Bearer JWT; owning driver only.

For Assured rides, the driver deposit is consumed and rider deposits are processed according to the Assured cancellation rules.

### `POST /rides/:id/driver-no-show`

Reports driver no-show at/after departure.

**Auth:** Bearer JWT; affected Assured passenger.

No GPS is currently required.

### `POST /rides/:id/half-time-decision`

Controls whether regular riders may be allowed onto an Assured ride after the half-time point.

**Auth:** Bearer JWT; owning driver.

**Request**
```json
{
  "decision": "ALLOW_REGULAR_RIDERS"
}
```

or

```json
{
  "decision": "KEEP_ASSURED_ONLY"
}
```

If the driver does not decide, the default is `KEEP_ASSURED_ONLY`.

---

## 6. Bookings

### `POST /bookings`

Creates a booking.

**Auth:** Bearer JWT

Regular booking supports:
- `PAY_NOW`
- `PAY_LATER`

Assured booking supports the Assured deposit flow.

**Representative Regular request**
```json
{
  "rideId": "<ride-id>",
  "seats": 1,
  "paymentMethod": "PAY_NOW"
}
```

For `PAY_NOW`, send the required `Idempotency-Key` header:

```http
Idempotency-Key: <unique-client-key>
```

**Regular payment**
- `PAY_LATER` → fare remains `UNPAID`
- `PAY_NOW` → wallet is debited atomically and booking becomes `PAID`
- Ride price is snapshotted at booking time.
- Seat reservation uses a database row lock to prevent overbooking.

**Assured rider deposit**
- Rider deposit = `bookedSeats × pricePerSeat × percentage / 100`.
- Default percentage is 5%.
- Example: 1 seat × ₹500 → **₹25 deposit**.
- Deposit percentage is snapshotted on the booking.
- Deposit is separate from fare.
- If an eligible `NEXT_ASSURED_DEPOSIT_FREE` coupon is applied, the deposit can be zero while fare remains unchanged.

### `GET /bookings/my`

Lists bookings belonging to the authenticated passenger.

**Auth:** Bearer JWT

### `GET /bookings/:id`

Returns an owned booking.

**Auth:** Bearer JWT

### `GET /bookings/driver/my-rides`

Lists bookings for rides owned by the authenticated driver.

**Auth:** Bearer JWT

**Query**
- `rideId` (optional)
- `status` (optional)
- `page` (default 1)
- `limit` (default 20, max 50)

Foreign `rideId` returns `404`.

### `POST /bookings/:id/cancel`

Cancels an eligible passenger booking before departure.

**Auth:** Bearer JWT; passenger only.

For Assured rides, the rider deposit is consumed/forfeited according to the Assured lifecycle rules.

### `POST /bookings/:id/rider-no-show`

Reports rider no-show at/after departure.

**Auth:** Bearer JWT; ride owner/driver.

For Assured rides, the rider deposit is consumed and the applicable platform/coupon/partial-fill rules are applied.

---

## 7. Assured Ride financial rules

### Driver deposit

Default admin setting: **5%**.

```text
driverDeposit =
publishedSeats × pricePerSeat × depositPercentage / 100
```

### Rider deposit

```text
riderDeposit =
bookedSeats × pricePerSeat × depositPercentage / 100
```

Deposits use integer Point amounts with HALF-UP rounding.

### Driver cancellation before trip start

- Driver loses/forfeits the driver deposit.
- Rider deposits are refunded according to the applicable cancellation policy.
- **60% of the driver's deposit** is distributed equally among eligible riders.
- Remaining **40% stays with BhaiWay**.
- If there are no eligible riders, the applicable driver deposit amount goes to BhaiWay.

### Rider cancellation before trip start

- Rider's Assured deposit is forfeited to BhaiWay.
- The applicable partial-fill policy can be evaluated.
- Rider may receive a `NEXT_ASSURED_DEPOSIT_FREE` coupon under the current lifecycle implementation/rules.

### Partial-fill

At the half-time decision point, the driver can:
- `ALLOW_REGULAR_RIDERS`
- `KEEP_ASSURED_ONLY`

If the ride remains partially filled:
- Compensation = **50% of fare for remaining seats**
- Maximum **2 seats**
- Maximum compensation **₹700**
- Funded by BhaiWay's platform wallet
- Compensation is tracked so the maximum cannot be exceeded.

### Completion

On successful Assured ride completion:
- Driver Assured deposit is released.
- Eligible rider Assured deposits are released.
- Held funds return to available balance.
- Deposit is not fare payment.

---

## 8. Wallet

There are currently **no public wallet HTTP endpoints**.

Wallet operations are service-layer operations used by booking and Assured lifecycle APIs.

Frontend should not directly manipulate wallet balances, holds, point lots, or platform wallet data.

---

## 9. Error / security conventions

Common responses:
- `400` validation / forbidden fields
- `401` missing or invalid JWT
- `404` unauthorized resource ownership / not found
- `409` business conflict / invalid state / duplicate / idempotency conflict
- `422` insufficient wallet balance where documented

Protected endpoints use:

```http
Authorization: Bearer <BHAIWAY_JWT>
```

The backend derives authenticated `userId` from JWT. Do not send `userId`/`driverId` as a substitute for authentication.

Global validation uses whitelist + forbid-non-whitelisted behavior.

---

## 10. Frontend integration flow

### Login

```text
MSG91 Mobile SDK
  ↓
OTP verification
  ↓
MSG91 access token
  ↓
POST /auth/msg91/verify
  ↓
BhaiWay JWT
  ↓
Secure token storage
```

### Protected request

```http
Authorization: Bearer <BHAIWAY_JWT>
```

### Recommended frontend API organization

```text
api/
  client
  auth
  users
  vehicles
  verification
  rides
  bookings
```

Use one API client/interceptor to attach the JWT automatically.

---

## 11. Current staging links

**API Base**
`https://bhaiway-backend.onrender.com`

**Swagger**
`https://bhaiway-backend.onrender.com/api/docs`

**Swagger JSON**
`https://bhaiway-backend.onrender.com/api/docs-json`

---

## 12. Important contract note

This document is a frontend companion to Swagger. If a field, enum, validation rule, or response property differs between this document and Swagger, **Swagger/OpenAPI wins** because it reflects the current deployed DTO/controller contract.

Business rules involving wallets, deposits, cancellation, compensation, and Assured rides should not be reimplemented in the frontend. The backend is the source of truth for those calculations and state transitions.
