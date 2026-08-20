export type ChatMessageSender = 'driver' | 'user';

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string;
  timeLabel: string;
  status?: 'sent' | 'read';
}

export interface DriverChatProfile {
  name: string;
  vehicleLabel: string;
  isOnline: boolean;
  avatarUri?: string;
  /** Shown under the peer name (e.g. "Rider" / "Driver"). */
  roleLabel?: string;
  verified?: boolean;
  /** Trip context banner route, e.g. "Home → Greater Noida Office". */
  routeLabel?: string;
  /** Trip context time, e.g. "Today, 08:00 AM". */
  tripTimeLabel?: string;
}
