"use server";

import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, serverTimestamp } from "firebase/firestore";
import type { Todo, TodoFormData, TaskCategory } from "@/lib/types";
import { suggestCategory as suggestCategoryFlow, type SuggestCategoryInput } from "@/ai/flows/suggest-category";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  // In a real app, you'd get this from the authenticated session.
  // For server actions, Firebase Admin SDK is typically used for auth, or you pass userId.
  // Since we are using client-side Firebase Auth, this action would ideally be called
  // by an authenticated client that passes the user's token for verification or userId.
  // For simplicity here, we'll assume auth.currentUser is available on server if using client-SDK style (not typical for server actions).
  // A more robust way is to verify ID token passed from client.
  // Or, if NextAuth.js is used, its session management.
  // For now, this is a placeholder. Client will pass userId.
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  throw new Error("User not authenticated");
}

export async function getTodosAction(userId: string): Promise<Todo[]> {
  if (!userId) throw new Error("User ID is required.");
  const todosCol = collection(db, `users/${userId}/todos`);
  const q = query(todosCol, orderBy("createdAt", "desc"));
  const todoSnapshot = await getDocs(q);
  const todos = todoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo));
  return todos;
}

export async function addTodoAction(userId: string, todoData: TodoFormData): Promise<Todo> {
  if (!userId) throw new Error("User ID is required.");
  
  const newTodo = {
    userId,
    description: todoData.description,
    category: todoData.category as TaskCategory,
    completed: false,
    createdAt: serverTimestamp(),
    dueDate: todoData.dueDate ? Timestamp.fromDate(new Date(todoData.dueDate)) : null,
  };

  const todosCol = collection(db, `users/${userId}/todos`);
  const docRef = await addDoc(todosCol, newTodo);
  
  revalidatePath("/");
  return { id: docRef.id, ...newTodo, createdAt: new Date() } as Todo; // Approximate createdAt for return
}

export async function updateTodoAction(userId: string, todoId: string, todoData: Partial<TodoFormData> & { completed?: boolean }): Promise<Todo> {
  if (!userId) throw new Error("User ID is required.");
  const todoRef = doc(db, `users/${userId}/todos`, todoId);
  
  const updateData: Partial<Omit<Todo, 'id' | 'userId' | 'createdAt'>> & { dueDate?: Timestamp | null } = {};
  if (todoData.description !== undefined) updateData.description = todoData.description;
  if (todoData.category !== undefined) updateData.category = todoData.category as TaskCategory;
  if (todoData.completed !== undefined) updateData.completed = todoData.completed;
  if (todoData.dueDate !== undefined) {
    updateData.dueDate = todoData.dueDate ? Timestamp.fromDate(new Date(todoData.dueDate)) : null;
  }
  
  await updateDoc(todoRef, updateData);
  revalidatePath("/");
  // For returning the updated Todo, ideally fetch it again or merge carefully
  // This is a simplified return
  const updatedTodo = (await getDocs(query(collection(db, `users/${userId}/todos`), where("__name__", "==", todoId)))).docs[0];
  return {id: updatedTodo.id, ...updatedTodo.data()} as Todo;
}

export async function deleteTodoAction(userId: string, todoId: string): Promise<void> {
  if (!userId) throw new Error("User ID is required.");
  const todoRef = doc(db, `users/${userId}/todos`, todoId);
  await deleteDoc(todoRef);
  revalidatePath("/");
}

export async function toggleTodoCompleteAction(userId: string, todoId: string, completed: boolean): Promise<Todo> {
  if (!userId) throw new Error("User ID is required.");
  const todoRef = doc(db, `users/${userId}/todos`, todoId);
  await updateDoc(todoRef, { completed });
  revalidatePath("/");
  const updatedTodo = (await getDocs(query(collection(db, `users/${userId}/todos`), where("__name__", "==", todoId)))).docs[0];
  return {id: updatedTodo.id, ...updatedTodo.data()} as Todo;
}

export async function suggestCategoryAction(taskDescription: string): Promise<string> {
  if (!taskDescription || taskDescription.trim().length < 3) {
    return ""; // Avoid calling AI for very short or empty descriptions
  }
  try {
    const input: SuggestCategoryInput = { taskDescription };
    const result = await suggestCategoryFlow(input);
    return result.suggestedCategory;
  } catch (error) {
    console.error("Error suggesting category:", error);
    return ""; // Fallback to empty string on error
  }
}
