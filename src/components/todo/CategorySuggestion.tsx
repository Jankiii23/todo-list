"use client";

import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface CategorySuggestionProps {
  suggestedCategory: string | null;
  onApplySuggestion: (category: string) => void;
  loading: boolean;
}

export function CategorySuggestion({
  suggestedCategory,
  onApplySuggestion,
  loading,
}: CategorySuggestionProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground mt-1">Getting category suggestion...</p>;
  }

  if (!suggestedCategory) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <p className="text-sm text-muted-foreground">
        AI Suggestion: <span className="font-semibold text-primary">{suggestedCategory}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onApplySuggestion(suggestedCategory)}
      >
        <Wand2 className="mr-1 h-3 w-3" /> Use
      </Button>
    </div>
  );
}
