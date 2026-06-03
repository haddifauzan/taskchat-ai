"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { TaskPriority, TaskStatus, TaskType } from "@/types";
import { formatDeadlineForDb } from "@/utils/date";

export async function createTask(data: {
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  course_id?: string;
  source_text?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const formattedDeadline = formatDeadlineForDb(data.deadline);

  const { error } = await supabase.from("assignments").insert([
    { ...data, deadline: formattedDeadline, user_id: user.id },
  ]);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    deadline: string;
    priority: TaskPriority;
    status: TaskStatus;
    type: TaskType;
    course_id: string;
  }>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData = { ...data };
  if ("deadline" in updateData) {
    updateData.deadline = formatDeadlineForDb(updateData.deadline) || undefined;
  }

  const { error } = await supabase
    .from("assignments")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return updateTask(id, { status });
}

