export interface Board {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: BoardMember[];
  tasks?: Task[];
}

export interface BoardMember {
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
  isDone: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface CreateBoardRequest {
  name: string;
}

export interface CreateTaskRequest {
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
}

export interface UpdateTaskRequest {
  title?: string;
  notes?: string;
  startAt?: string;
  endAt?: string;
  isDone?: boolean;
}