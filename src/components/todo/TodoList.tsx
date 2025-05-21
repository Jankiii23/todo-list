"use client";

import type { Todo } from "@/lib/types";
import { TodoItem } from "./TodoItem";
import { ListChecks, AlertTriangle } from "lucide-react";
import Image from 'next/image';


interface TodoListProps {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
}

export function TodoList({ todos, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <Image 
            src="https://placehold.co/300x200.png" 
            alt="No tasks" 
            width={300} 
            height={200} 
            className="mx-auto mb-6 rounded-lg shadow-md"
            data-ai-hint="empty checklist"
        />
        <h3 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center">
          <ListChecks className="h-8 w-8 mr-3 text-primary" />
          All Clear!
        </h3>
        <p className="text-muted-foreground">You have no tasks. Add a new one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onEdit={onEdit} />
      ))}
    </div>
  );
}
