import type { ChatMessage, DriverChatProfile } from '../types';

export type RideChatPerspective = 'rider' | 'driver';

export const DRIVER_CHAT_SCREEN = {
  onlineLabel: 'Online',
  riderRoleLabel: 'Rider',
  driverRoleLabel: 'Driver',
  todayLabel: 'TODAY',
  inputPlaceholder: 'Type a message...',
  moreTitle: 'More',
  moreMessage: 'More chat actions will be available soon.',
  attachTitle: 'Attachment',
  attachMessage: 'File attachments will be available soon.',
  defaultRouteLabel: 'Home → Greater Noida Office',
  defaultTripTimeLabel: 'Today, 08:00 AM',
  defaultRiderAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIMngQh5vHDFYOJDzN-VccWC5ZtMoyVOxHnIgq4_pDP0_BGH3G2vYobt63vzVg5lm3HIv2ScmgmadqkDdhgApMiZD2RZq73t9yLNorCsv6KdvqnaPqBWjFxqlA-SYzvV52zBpcvWlZ2CQa_1oGv40aCalm2_uHyTR2Yj_4fm0gi4ktN9azn1Pi2bc34t1oGZ9D8lqEvqw-sxrdI4HQQlZM0ZagU17lteqj0EU-ZT895ejbtRvENERFnjnsIh7i6Gb9KZlImChULOA',
} as const;

export const DRIVER_CHAT_QUICK_REPLIES = [
  'On my way',
  'Wait 5 mins',
  'Where are you?',
] as const;

/** Quick replies for the driver chatting with a confirmed rider. */
export const RIDER_CHAT_QUICK_REPLIES_FROM_DRIVER = [
  'Sure, waiting.',
  "I'm near the pillar.",
] as const;

export const getDriverChatMock = (params: {
  driverName?: string;
  carModel?: string;
  perspective?: RideChatPerspective;
  routeLabel?: string;
  tripTimeLabel?: string;
  avatarUri?: string;
}): { profile: DriverChatProfile; messages: ChatMessage[] } => {
  const perspective = params.perspective === 'driver' ? 'driver' : 'rider';
  const name =
    params.driverName?.trim() || (perspective === 'driver' ? 'Amit S.' : 'Arjun');
  const car = params.carModel?.trim();
  const vehicleLabel =
    !car
      ? perspective === 'driver'
        ? 'Confirmed rider'
        : 'White Honda City'
      : /passenger|·|ka-|seat|engineer|@/i.test(car)
        ? car
        : `White ${car}`;

  if (perspective === 'driver') {
    const firstName = name.split(' ')[0] || 'there';
    return {
      profile: {
        name,
        vehicleLabel,
        isOnline: true,
        verified: true,
        roleLabel: DRIVER_CHAT_SCREEN.riderRoleLabel,
        routeLabel: params.routeLabel?.trim() || DRIVER_CHAT_SCREEN.defaultRouteLabel,
        tripTimeLabel:
          params.tripTimeLabel?.trim() || DRIVER_CHAT_SCREEN.defaultTripTimeLabel,
        avatarUri: params.avatarUri?.trim() || DRIVER_CHAT_SCREEN.defaultRiderAvatar,
      },
      messages: [
        {
          id: 'm1',
          sender: 'driver',
          text: `Hi ${firstName}, I've reached the pickup point (Sector 5 Gate).`,
          timeLabel: '07:54 AM',
          status: 'read',
        },
        {
          id: 'm2',
          sender: 'user',
          text: "Great, I'm just coming out. 2 mins please.",
          timeLabel: '07:55 AM',
        },
      ],
    };
  }

  return {
    profile: {
      name,
      vehicleLabel,
      isOnline: true,
      roleLabel: DRIVER_CHAT_SCREEN.driverRoleLabel,
      verified: true,
      routeLabel: params.routeLabel?.trim() || DRIVER_CHAT_SCREEN.defaultRouteLabel,
      tripTimeLabel:
        params.tripTimeLabel?.trim() || DRIVER_CHAT_SCREEN.defaultTripTimeLabel,
    },
    messages: [
      {
        id: 'm1',
        sender: 'driver',
        text: 'I have arrived at the pickup point.',
        timeLabel: '10:42 AM',
      },
      {
        id: 'm2',
        sender: 'driver',
        text: "I'm waiting near Gate No. 3.",
        timeLabel: '10:42 AM',
      },
      {
        id: 'm3',
        sender: 'user',
        text: "Great, I'm coming in 2 minutes.",
        timeLabel: '10:43 AM',
        status: 'read',
      },
      {
        id: 'm4',
        sender: 'user',
        text: 'I see your car.',
        timeLabel: '10:44 AM',
        status: 'read',
      },
    ],
  };
};

export const getDriverChatPath = (params: {
  driverName?: string;
  carModel?: string;
  threadId?: string;
  perspective?: RideChatPerspective;
  routeLabel?: string;
  tripTimeLabel?: string;
  avatarUri?: string;
}) => ({
  pathname: '/ride-search/driver-chat' as const,
  params: {
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    threadId: params.threadId ?? '',
    perspective: params.perspective ?? 'rider',
    routeLabel: params.routeLabel ?? '',
    tripTimeLabel: params.tripTimeLabel ?? '',
    avatarUri: params.avatarUri ?? '',
  },
});

export const formatChatTime = (date = new Date()): string =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
