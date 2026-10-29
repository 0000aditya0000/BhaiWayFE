import { REALTIME_EVENTS, realtimeService } from '@/services/realtime';

import type { NormalizedRequest } from './demoRouter';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type DemoRatingTask = {
  taskId: string;
  rideId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  role: 'DRIVER' | 'PASSENGER';
  skippedAt?: string | null;
  status: 'PENDING' | 'COMPLETED';
  ride?: {
    rideId: string;
    source: string;
    destination: string;
    departureDate: string;
    departureTime: string;
  };
};

const pendingTasks: DemoRatingTask[] = [
  {
    taskId: 'demo-task-passenger-1',
    rideId: 'driver-trip-1',
    bookingId: 'booking-1',
    userId: 'passenger-1',
    userName: 'Amit R.',
    userPhoto: '',
    role: 'PASSENGER',
    status: 'PENDING',
    ride: {
      rideId: 'driver-trip-1',
      source: 'Koramangala',
      destination: 'BhaiWay Corporate Office',
      departureDate: '2026-08-02',
      departureTime: '09:00',
    },
  },
];

const submittedRatings: Array<Record<string, unknown>> = [];

export const handleRatingsDemo = async (request: NormalizedRequest): Promise<unknown> => {
  await wait(80);
  const { method, url, body } = request;
  const path = url.split('?')[0] ?? url;

  if (method === 'GET' && path === '/ratings/pending') {
    return {
      items: pendingTasks
        .filter((task) => task.status === 'PENDING')
        .map(({ status: _status, ...task }) => task),
    };
  }

  if (method === 'POST' && path === '/ratings') {
    const payload = (body ?? {}) as Record<string, unknown>;
    const taskId = String(payload.taskId ?? '').trim();
    const task = pendingTasks.find((item) => item.taskId === taskId);
    if (!task) {
      throw new Error('Rating task not found');
    }
    task.status = 'COMPLETED';
    const rating = {
      id: `rating_${Date.now()}`,
      taskId,
      rating: payload.rating,
      comment: payload.comment ?? null,
      createdAt: new Date().toISOString(),
    };
    submittedRatings.push(rating);
    realtimeService.publish(REALTIME_EVENTS.RATING_CREATED, rating);
    return rating;
  }

  const skipMatch = path.match(/^\/ratings\/([^/]+)\/skip$/);
  if (method === 'POST' && skipMatch) {
    const taskId = skipMatch[1];
    const task = pendingTasks.find((item) => item.taskId === taskId);
    if (!task) {
      throw new Error('Rating task not found');
    }
    task.skippedAt = new Date().toISOString();
    return { taskId, status: 'PENDING', skippedAt: task.skippedAt };
  }

  const userRatingsMatch = path.match(/^\/ratings\/user\/([^/]+)$/);
  if (method === 'GET' && userRatingsMatch) {
    const query = url.includes('?') ? new URLSearchParams(url.split('?')[1]) : null;
    const direction = query?.get('direction')?.toUpperCase() ?? 'RECEIVED';

    if (direction === 'GIVEN') {
      return {
        averageRating: 4.5,
        totalRatings: 1,
        total: 1,
        direction: 'GIVEN',
        items: [
          {
            id: 'demo-given-1',
            taskId: 'task-given-1',
            rating: 5,
            comment: 'Excellent co-passenger.',
            createdAt: '2026-08-20T10:00:00.000Z',
            fromUser: { userId: 'me', userName: 'You', userPhoto: null },
            toUser: { userId: 'passenger-2', userName: 'Amit R.', userPhoto: null },
            role: 'PASSENGER',
            ride: {
              rideId: 'driver-trip-3',
              source: 'Koramangala',
              destination: 'Electronic City',
              departureDate: '2026-08-20',
              departureTime: '08:30',
            },
          },
        ],
      };
    }

    if (submittedRatings.length === 0) {
      return {
        averageRating: 4.0,
        totalRatings: 2,
        total: 2,
        direction: 'RECEIVED',
        items: [
          {
            id: 'demo-rating-1',
            taskId: 'task-1',
            rating: 5,
            comment: 'Great co-rider — punctual and friendly.',
            createdAt: '2026-08-15T10:00:00.000Z',
            fromUser: { userId: 'driver-1', userName: 'Priya S.', userPhoto: null },
            toUser: { userId: 'passenger-1', userName: 'You', userPhoto: null },
            role: 'PASSENGER',
            ride: {
              rideId: 'driver-trip-1',
              source: 'Koramangala',
              destination: 'BhaiWay Corporate Office',
              departureDate: '2026-08-02',
              departureTime: '09:00',
            },
          },
          {
            id: 'demo-rating-2',
            taskId: 'task-2',
            rating: 4,
            comment: 'Smooth ride and safe driving.',
            createdAt: '2026-08-10T18:30:00.000Z',
            fromUser: { userId: 'driver-2', userName: 'Rahul M.', userPhoto: null },
            toUser: { userId: 'passenger-1', userName: 'You', userPhoto: null },
            role: 'PASSENGER',
            ride: {
              rideId: 'driver-trip-2',
              source: 'Indiranagar',
              destination: 'Whitefield',
              departureDate: '2026-08-10',
              departureTime: '18:00',
            },
          },
        ],
      };
    }
    return { items: submittedRatings, total: submittedRatings.length, direction: 'RECEIVED' };
  }

  const rideRatingsMatch = path.match(/^\/rides\/([^/]+)\/ratings$/);
  if (method === 'GET' && rideRatingsMatch) {
    const rideId = rideRatingsMatch[1];
    const list = submittedRatings.filter((item) => String(item.rideId ?? '') === rideId);
    return { ratings: list, total: list.length };
  }

  throw new Error(`Demo ratings route not implemented: ${method} ${path}`);
};
