export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskRecurring = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  color?: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
  members?: BoardMember[];
  tasks?: Task[];
  activeTasks?: number;
}

export interface BoardMember {
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
  status: 'pending' | 'expired';
  isDone: boolean;
  priority: TaskPriority;
  recurringType?: TaskRecurring;
  assigneeId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface TaskComment {
  id: string;
  taskId?: string;
  authorId: string;
  firstName: string;
  lastName: string;
  email: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  name: string;
  color?: string;
  emoji?: string;
}

export interface CreateTaskRequest {
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  recurringType?: TaskRecurring;
}

export interface UpdateTaskRequest {
  title?: string;
  notes?: string;
  startAt?: string;
  endAt?: string;
  isDone?: boolean;
  priority?: TaskPriority;
  assigneeId?: string | null;
  recurringType?: TaskRecurring;
}
