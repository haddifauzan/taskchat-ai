import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Membaca konfigurasi dari .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    const val = vals.join("=").trim();
    if (key === "NEXT_PUBLIC_SUPABASE_URL" && !supabaseUrl) supabaseUrl = val;
    if (key === "SUPABASE_SERVICE_ROLE_KEY" && !serviceRoleKey) serviceRoleKey = val;
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function clearData() {
  console.log("🧹 Sedang menghapus semua data tugas dan mata kuliah...\n");

  // 1. Hapus semua data dari assignments
  const { error: assignError, count: assignCount } = await supabase
    .from("assignments")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (assignError) {
    console.error("❌ Gagal menghapus assignments:", assignError.message);
  } else {
    console.log(`✅ Berhasil menghapus ${assignCount ?? 0} tugas (assignments).`);
  }

  // 2. Hapus semua data dari courses
  const { error: courseError, count: courseCount } = await supabase
    .from("courses")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (courseError) {
    console.error("❌ Gagal menghapus courses:", courseError.message);
  } else {
    console.log(`✅ Berhasil menghapus ${courseCount ?? 0} mata kuliah (courses).`);
  }

  console.log("\n🎉 Selesai! Database tugas dan mata kuliah berhasil dibersihkan.");
}

clearData();
