export interface Board {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: BoardMember[];
  tasks?: Task[];
  activeTasks?: number; // 👈 add this
  author: '';
}


export interface  BoardMember {
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  user?: {
  };
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
  status: 'pending' | 'expired';  // <--- Add this
  isDone: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  author: '';
  updatedBy: '';
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