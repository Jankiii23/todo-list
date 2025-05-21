"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { CalendarIcon, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { addTodoAction, suggestCategoryAction } from "@/lib/actions";
import { TASK_CATEGORIES, type TaskCategory, type TodoFormData } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategorySuggestion } from "./CategorySuggestion";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  description: z.string().min(1, { message: "Description cannot be empty." }).max(200, { message: "Description too long."}),
  category: z.enum(TASK_CATEGORIES, { required_error: "Please select a category." }),
  dueDate: z.date().optional().nullable(),
});

// Debounce function
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


export function AddTodoForm() {
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
    }, 1000), // 1 second debounce
    []
  );

  const descriptionValue = form.watch("description");
  useEffect(() => {
    debouncedSuggestCategory(descriptionValue);
  }, [descriptionValue, debouncedSuggestCategory]);


  const mutation = useMutation({
    mutationFn: (newTodo: TodoFormData) => {
      if (!user) throw new Error("User not authenticated.");
      return addTodoAction(user.uid, newTodo);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Todo added successfully." });
      queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
      form.reset();
      setSuggestedCategory(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add todo.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add a todo." });
      return;
    }
    setIsSubmitting(true);
    const todoData: TodoFormData = {
      ...values,
      dueDate: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : null,
    };
    mutation.mutate(todoData);
  }
  
  const handleApplySuggestion = (category: string) => {
    form.setValue("category", category as TaskCategory);
    setSuggestedCategory(null); // Clear suggestion after applying
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What needs to be done?" {...field} rows={3} />
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
        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isSubmitting || mutation.isPending ? "Adding Task..." : "Add Task"}
        </Button>
      </form>
    </Form>
  );
}
