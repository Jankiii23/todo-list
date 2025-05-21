"use client";

import type { Todo } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteTodoAction, toggleTodoCompleteAction } from "@/lib/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "Work": return "default";
      case "Personal": return "secondary";
      case "Errands": return "outline"; // Using outline for variety, can map to colors
      case "Health": return "destructive"; // Example, can be customized
      case "Finance": return "default"; // Using primary/default
      case "Education": return "secondary";
      default: return "outline";
    }
  };
  
  const categoryBadgeVariant = getCategoryBadgeVariant(todo.category);


  const toggleMutation = useMutation({
    mutationFn: ({ todoId, completed }: { todoId: string; completed: boolean }) => {
      if (!user) throw new Error("User not authenticated.");
      return toggleTodoCompleteAction(user.uid, todoId, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update todo status.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (todoId: string) => {
      if (!user) throw new Error("User not authenticated.");
      return deleteTodoAction(user.uid, todoId);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Todo deleted." });
      queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete todo.",
      });
    },
  });

  const handleToggleComplete = () => {
    toggleMutation.mutate({ todoId: todo.id, completed: !todo.completed });
  };

  const handleDelete = () => {
    deleteMutation.mutate(todo.id);
  };

  return (
    <Card className={`transition-all duration-300 ${todo.completed ? "bg-muted/50 shadow-none" : "shadow-md hover:shadow-lg"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Checkbox
              id={`todo-${todo.id}`}
              checked={todo.completed}
              onCheckedChange={handleToggleComplete}
              className="mt-1"
              aria-labelledby={`todo-desc-${todo.id}`}
            />
            <CardTitle 
              id={`todo-desc-${todo.id}`}
              className={`text-lg font-medium leading-tight ${todo.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {todo.description}
            </CardTitle>
          </div>
           <Badge variant={categoryBadgeVariant} className="whitespace-nowrap ml-2">
              {todo.category}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {todo.dueDate && (
          <div className="text-xs text-muted-foreground flex items-center">
            <CalendarDays className="h-3 w-3 mr-1.5" />
            Due: {format(new Date((todo.dueDate as any).seconds ? (todo.dueDate as any).toDate() : todo.dueDate), "PPP")}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(todo)} disabled={todo.completed}>
          <Edit3 className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
