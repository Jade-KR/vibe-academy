"use client";

import { PasswordForm, ConnectedAccounts } from "@/features/settings";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <PasswordForm />
      <ConnectedAccounts />
    </div>
  );
}
