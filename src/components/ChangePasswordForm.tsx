"use client";

import { changePassword } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

const ChangePasswordForm = () => {
  const [state, formAction] = useFormState(changePassword, {
    success: false,
    error: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast(state.message || "Password updated!");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 bg-white p-6 rounded-md shadow-sm max-w-md"
    >
      <h1 className="text-xl font-semibold">Change Password</h1>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Current Password</label>
        <input
          type="password"
          name="currentPassword"
          required
          className="p-2 rounded-md ring-1 ring-gray-300 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">New Password</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          className="p-2 rounded-md ring-1 ring-gray-300 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Confirm New Password</label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          className="p-2 rounded-md ring-1 ring-gray-300 text-sm"
        />
      </div>
      {state.error && (
        <span className="text-red-500 text-sm">
          {state.message || "Something went wrong."}
        </span>
      )}
      {state.success && (
        <span className="text-green-600 text-sm">{state.message}</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md text-sm">
        Update Password
      </button>
    </form>
  );
};

export default ChangePasswordForm;
