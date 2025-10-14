export interface Notification {
  id: string;
  userId: string;
  boardId: string;
  type: 'BOARD_CREATED' | 'TASK_CREATED' | 'MEMBER_INVITED' | 'MEMBER_ADDED' | 'TASK_COMPLETED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  
  metadata?: {
    boardId?: string;
    taskId?: string;
    memberId?: string;
  };
}

export interface CreateNotificationRequest {
  type: Notification['type'];
  title: string;
  message: string;
  metadata?: Notification['metadata'];
}