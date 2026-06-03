"use client";

import { useState, useRef } from "react";
import ConfirmModal from "@/components/ConfirmModal";

export default function SignOutCard() {
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-[#1a1a2e] mb-2">Keluar</h2>
      <p className="text-sm text-[#9ca3af] mb-4">
        Kamu akan keluar dari semua sesi aktif.
      </p>
      <form
        ref={formRef}
        action="/api/auth/signout"
        method="POST"
        onSubmit={(e) => {
          e.preventDefault();
          setShowConfirm(true);
        }}
      >
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-xl transition-colors cursor-pointer"
        >
          Keluar dari Akun
        </button>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        title="Keluar dari Akun"
        message="Apakah Anda yakin ingin keluar? Anda harus masuk kembali untuk mengelola tugas."
        confirmText="Keluar"
        cancelText="Batal"
        isDanger={true}
        onConfirm={() => {
          formRef.current?.submit();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
