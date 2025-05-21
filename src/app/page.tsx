"use client"; // This page needs client-side logic for auth checks & router

import { Header } from "@/components/layout/Header";
import { TodoDashboard } from "@/components/todo/TodoDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Show a loading state or a minimal layout while checking auth / redirecting
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-6 p-4 md:p-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-1">
                    <Skeleton className="h-10 w-1/2 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-10 w-1/3 mb-4" />
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <TodoDashboard />
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} TaskFlow. All rights reserved.
      </footer>
    </div>
  );
}
