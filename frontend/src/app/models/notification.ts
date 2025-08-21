export type NotificationType =
  | "info"
  | "warning"
  | "error"
  | "success"
  | "alert"
  | "progression";

export interface Notifications {
  id: number;
  message: string;
  is_read: boolean;
  type: NotificationType;
  created_at: string;
  user_id: number;
}

