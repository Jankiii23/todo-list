import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

export interface User extends FirebaseUser {}

export interface Todo {
  id: string;
  userId: string;
  description: string;
  category: string;
  completed: boolean;
  createdAt: Timestamp | Date; // Store as Timestamp, allow Date for input
  dueDate?: Timestamp | Date | null; // Optional due date
}

export type TodoFormData = {
  description: string;
  category: string;
  dueDate?: string | null; // Date as string from form input
};

export const TASK_CATEGORIES = ["Work", "Personal", "Errands", "Health", "Finance", "Education", "Other"] as const;
export type TaskCategory = typeof TASK_CATEGORIES[number];
