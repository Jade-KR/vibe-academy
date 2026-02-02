"use client";

import { ProfileForm, AvatarUpload } from "@/features/settings";
import { useProfile } from "@/features/settings";

export default function ProfileSettingsPage() {
  const { profile } = useProfile();

  return (
    <div className="space-y-6">
      <AvatarUpload avatarUrl={profile?.avatarUrl ?? null} name={profile?.name ?? null} />
      <ProfileForm />
    </div>
  );
}
