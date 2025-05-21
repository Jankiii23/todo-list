"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getTodosAction } from "@/lib/actions";
import type { Todo } from "@/lib/types";
import { AddTodoForm } from "./AddTodoForm";
import { TodoList } from "./TodoList";
import { EditTodoDialog } from "./EditTodoDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ListTodo } from "lucide-react";

export function TodoDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const { data: todos, isLoading: todosLoading, error: todosError } = useQuery<Todo[], Error>({
    queryKey: ["todos", user?.uid],
    queryFn: () => {
      if (!user?.uid) return Promise.resolve([]); // Or throw an error
      return getTodosAction(user.uid);
    },
    enabled: !!user && !authLoading, // Only run query if user is loaded and authenticated
  });

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
  };

  const handleCloseEditDialog = () => {
    setEditingTodo(null);
  };

  if (authLoading || (todosLoading && user)) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Skeleton for AddTodoForm */}
        <Card className="shadow-md">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        {/* Skeleton for TodoList */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-1/4" />
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  if (todosError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Tasks</AlertTitle>
        <AlertDescription>
          Could not fetch your tasks. Please try again later. {todosError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 p-4 md:p-6">
      <div className="lg:col-span-1">
        <div className="sticky top-20"> {/* Adjust top value based on header height */}
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <ListTodo className="mr-2 h-6 w-6 text-primary" />
            Add New Task
          </h2>
          <AddTodoForm />
        </div>
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-semibold mb-4">Your Tasks</h2>
        <TodoList todos={todos || []} onEdit={handleEditTodo} />
      </div>
      {editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          isOpen={!!editingTodo}
          onClose={handleCloseEditDialog}
        />
      )}
    </div>
  );
}

// Minimal Card components for Skeleton structure
const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={cn("border rounded-lg bg-card", className)}>{children}</div>;
const CardHeader: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={cn("p-4", className)}>{children}</div>;
const CardContent: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={cn("p-4 pt-0", className)}>{children}</div>;
const CardFooter: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={cn("p-4 pt-0", className)}>{children}</div>;
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

