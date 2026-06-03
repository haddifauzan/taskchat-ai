import React from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SupabaseTestPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isUrlConfigured = !!supabaseUrl && supabaseUrl !== "your-supabase-project-url";
  const isKeyConfigured = !!supabaseAnonKey && supabaseAnonKey !== "your-supabase-anon-key";
  const isFullyConfigured = isUrlConfigured && isKeyConfigured;

  let connectionSuccess = false;
  let connectionError = "";
  let fetchedData: any[] | null = null;

  if (isFullyConfigured) {
    try {
      const supabase = await createClient();
      // Try to read a dummy list or check auth health/response
      // We will perform a simple query to see if we can talk to the API
      const { data, error } = await supabase.from("_non_existent_table_for_test").select("*").limit(1);
      
      // If error is code "PGRST116" or "42P01" (table doesn't exist), it means we connected successfully but table is missing
      // If error is connection error or invalid key, code is different.
      if (
        error &&
        (error.code === "42P01" ||
          error.code === "PGRST116" ||
          (error as any).status === 406 ||
          error.message?.includes("schema cache") ||
          error.message?.includes("Could not find the table"))
      ) {
        connectionSuccess = true;
      } else if (!error) {
        connectionSuccess = true;
        fetchedData = data;
      } else {
        connectionError = error.message;
      }
    } catch (e: any) {
      connectionError = e?.message || "Unknown connection error";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f15_1px,transparent_1px),linear-gradient(to_bottom,#0f0f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              S
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Supabase Integration Hub
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Next.js App Router & Supabase Connectivity Status
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl transition-all duration-200"
            >
              Back to Home
            </Link>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-medium text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-[0_4px_12px_rgba(52,211,153,0.2)] transition-all duration-200"
            >
              Open Supabase Console
            </a>
          </div>
        </header>

        {/* Connection Status Panel */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Connection Diagnostics</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Analyzing the connection environment variables and testing network communication.
              </p>

              {/* Steps list */}
              <div className="space-y-4">
                {/* Step 1: SDK Installation */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5 text-xs font-bold border border-emerald-500/30">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">SDK Dependencies Installed</h3>
                    <p className="text-xs text-zinc-500">`@supabase/supabase-js` and `@supabase/ssr` have been added to package.json</p>
                  </div>
                </div>

                {/* Step 2: Utility Helpers */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5 text-xs font-bold border border-emerald-500/30">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Supabase Client Utilities Generated</h3>
                    <p className="text-xs text-zinc-500">Created helper clients in `utils/supabase/client.ts` and `server.ts`</p>
                  </div>
                </div>

                {/* Step 3: Middleware */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5 text-xs font-bold border border-emerald-500/30">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Session Middleware Registered</h3>
                    <p className="text-xs text-zinc-500">Active session and cookie management is configured inside `middleware.ts`</p>
                  </div>
                </div>

                {/* Step 4: Env Setup */}
                <div className="flex items-start gap-3">
                  {isFullyConfigured ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5 text-xs font-bold border border-emerald-500/30">
                      ✓
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mt-0.5 text-xs font-bold border border-amber-500/30 animate-pulse">
                      !
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-white">Environment Configuration</h3>
                    {isFullyConfigured ? (
                      <p className="text-xs text-emerald-400">`.env.local` config loaded. Project URL: <code className="bg-zinc-800 px-1 py-0.5 rounded text-white">{supabaseUrl}</code></p>
                    ) : (
                      <p className="text-xs text-amber-400">
                        Missing or placeholder credentials in `.env.local`. Fill in the values to start communicating!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Setup Instructions if not configured */}
            {!isFullyConfigured && (
              <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <p className="text-xs font-medium text-white mb-2">How to configure:</p>
                <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-1.5">
                  <li>Create a file named <code className="text-emerald-400">.env.local</code> in the root directory.</li>
                  <li>Copy the contents of <code className="text-zinc-300">.env.local.example</code> into it.</li>
                  <li>Get your Project API credentials from Supabase: Settings &gt; API.</li>
                  <li>Paste the credentials and restart your Next.js dev server.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Right Status Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center">
            {isFullyConfigured ? (
              connectionSuccess ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-pulse">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1">Connected Successfully</h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-3">
                    Active Connection
                  </span>
                  <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed">
                    Your application is talking to Supabase database services smoothly.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1">Connection Error</h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 mb-3">
                    Failed Connection
                  </span>
                  <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed mb-2">
                    Unable to connect. Check your project credentials in `.env.local`.
                  </p>
                  <div className="max-w-[220px] bg-black/40 border border-zinc-800 p-2 rounded text-[10px] text-red-300 font-mono text-left overflow-x-auto whitespace-pre-wrap">
                    {connectionError}
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Awaiting Configuration</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700 mb-3">
                  Offline Mode
                </span>
                <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed">
                  Provide credentials in `.env.local` to trigger connection checks.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Documentation Tab Section */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-1">Code Patterns & Implementation Guide</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Copy and paste these snippets to query, authenticate, and manage state in your application pages.
          </p>

          <div className="flex flex-col gap-6">
            {/* Pattern 1: Server Components */}
            <div className="border border-zinc-800/60 bg-zinc-900/60 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400 font-mono">1. Server Component (Fetching Data)</span>
                <span className="text-[10px] text-zinc-500 font-mono">app/posts/page.tsx</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300 leading-5">
{`import { createClient } from "@/utils/supabase/server";

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*");

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Posts</h1>
      <ul className="mt-4 space-y-2">
        {posts?.map((post) => (
          <li key={post.id} className="border p-4 rounded-lg bg-zinc-900">
            <h2 className="font-semibold">{post.title}</h2>
            <p className="text-sm text-zinc-400">{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}`}
                </pre>
              </div>
            </div>

            {/* Pattern 2: Client Components */}
            <div className="border border-zinc-800/60 bg-zinc-900/60 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400 font-mono">2. Client Component (Interactive / Realtime)</span>
                <span className="text-[10px] text-zinc-500 font-mono">components/TodoItem.tsx</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300 leading-5">
{`"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TodoList() {
  const [todos, setTodos] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await supabase.from("todos").select("*");
      if (data) setTodos(data);
    };
    fetchTodos();
  }, [supabase]);

  const handleAddTodo = async (title: string) => {
    const { data, error } = await supabase
      .from("todos")
      .insert([{ title, is_completed: false }])
      .select();
    
    if (data) {
      setTodos([...todos, data[0]]);
    }
  };

  return (
    <div>
      {/* Render todos and form here */}
    </div>
  );
}`}
                </pre>
              </div>
            </div>

            {/* Pattern 3: Server Actions */}
            <div className="border border-zinc-800/60 bg-zinc-900/60 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400 font-mono">3. Server Action (Form Mutation / Auth)</span>
                <span className="text-[10px] text-zinc-500 font-mono">app/actions.ts</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300 leading-5">
{`"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPostAction(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .insert([{ title, content }]);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/posts");
}`}
                </pre>
              </div>
            </div>

            {/* Step 4: SQL Helper */}
            <div className="border border-zinc-800/60 bg-zinc-900/60 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400 font-mono">4. Sample Database Schema (SQL Query)</span>
                <span className="text-[10px] text-zinc-500 font-mono">Supabase SQL Editor</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300 leading-5">
{`-- Create a sample 'posts' table
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table posts enable row level security;

-- Create policy to allow anyone to read posts
create policy "Allow public read access"
  on posts for select
  using (true);

-- Create policy to allow authenticated users to insert posts
create policy "Allow authenticated users to insert posts"
  on posts for insert
  with check (auth.role() = 'authenticated');`}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
