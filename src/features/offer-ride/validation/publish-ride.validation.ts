import { z } from 'zod';

export const publishRideValidationSchema = z.object({
  origin: z.string().trim().min(3, 'Enter a valid origin'),
  destination: z.string().trim().min(3, 'Enter a valid destination'),
  departureDate: z.string().trim().min(1, 'Select departure date'),
  departureTime: z.string().trim().min(1, 'Select departure time'),
  maxTwoInBackSeat: z.boolean(),
  availableSeats: z.number().min(1).max(8),
  womenOnly: z.boolean(),
  pricePerSeat: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, 'Enter a valid price per seat'),
});

export type PublishRideFormSchema = z.infer<typeof publishRideValidationSchema>;
