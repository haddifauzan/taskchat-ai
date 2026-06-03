export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";
export type TaskType = "tugas" | "quiz" | "tubes" | "presentasi" | "praktikum";

export interface Course {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  source_text: string | null;
  created_at: string;
  courses?: Pick<Course, "id" | "name" | "color"> | null;
}

export interface Reminder {
  id: string;
  assignment_id: string;
  reminder_type: "h-7" | "h-3" | "h-1" | "h-0";
  sent_at: string | null;
  created_at: string;
  assignments?: Pick<Assignment, "id" | "title" | "deadline"> | null;
}

export interface DashboardStats {
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  total: number;
}
