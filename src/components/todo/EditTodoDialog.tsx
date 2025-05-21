"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Wand2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { updateTodoAction, suggestCategoryAction } from "@/lib/actions";
import { TASK_CATEGORIES, type TaskCategory, type Todo, type TodoFormData } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategorySuggestion } from "./CategorySuggestion";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  description: z.string().min(1, { message: "Description cannot be empty." }).max(200, { message: "Description too long."}),
  category: z.enum(TASK_CATEGORIES, { required_error: "Please select a category." }),
  dueDate: z.date().optional().nullable(),
});

interface EditTodoDialogProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
}

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};


export function EditTodoDialog({ todo, isOpen, onClose }: EditTodoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: undefined,
      dueDate: null,
    },
  });

  useEffect(() => {
    if (todo) {
      form.reset({
        description: todo.description,
        category: todo.category as TaskCategory,
        dueDate: todo.dueDate ? ((todo.dueDate as any).seconds ? (todo.dueDate as any).toDate() : new Date(todo.dueDate as string)) : null,
      });
      setSuggestedCategory(null); // Reset suggestion on new todo
    }
  }, [todo, form, isOpen]);

  const debouncedSuggestCategory = useCallback(
    debounce(async (description: string) => {
      if (description.trim().length >= 3) {
        setSuggestionLoading(true);
        try {
          const category = await suggestCategoryAction(description);
          if (category && TASK_CATEGORIES.includes(category as TaskCategory)) {
            setSuggestedCategory(category);
          } else {
            setSuggestedCategory(null);
          }
        } catch (error) {
          console.error("Error fetching category suggestion:", error);
          setSuggestedCategory(null);
        } finally {
          setSuggestionLoading(false);
        }
      } else {
        setSuggestedCategory(null);
      }
    }, 1000),
    []
  );

  const descriptionValue = form.watch("description");
  useEffect(() => {
    if (isOpen) { // Only run debounce if dialog is open
      debouncedSuggestCategory(descriptionValue);
    }
  }, [descriptionValue, debouncedSuggestCategory, isOpen]);

  const mutation = useMutation({
    mutationFn: (updatedTodoData: { todoId: string, data: TodoFormData}) => {
      if (!user) throw new Error("User not authenticated.");
      return updateTodoAction(user.uid, updatedTodoData.todoId, updatedTodoData.data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Todo updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update todo.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !todo) {
      toast({ variant: "destructive", title: "Error", description: "Cannot update todo." });
      return;
    }
    setIsSubmitting(true);
    const todoData: TodoFormData = {
      ...values,
      dueDate: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : null,
    };
    mutation.mutate({ todoId: todo.id, data: todoData });
  }

  const handleApplySuggestion = (category: string) => {
    form.setValue("category", category as TaskCategory);
    setSuggestedCategory(null);
  };

  if (!isOpen || !todo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What needs to be done?" {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TASK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <CategorySuggestion 
                    suggestedCategory={suggestedCategory} 
                    onApplySuggestion={handleApplySuggestion}
                    loading={suggestionLoading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date)}
                         disabled={(date) =>
                           date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                         }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {isSubmitting || mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
