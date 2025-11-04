import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardBody,
  Input, Textarea, Button,
  Select, SelectItem
} from "@heroui/react";
import { User } from "lucide-react";
import Banner from "./components/Banner";
import Header from "./components/Header";
import { useAuth } from "./contexts/AuthContext";
import NotificationBanner from "./components/NotificationBanner";
import { buildDiceBearUrl } from "../utils/buildDiceBearURL";
import { Endpoints } from "@/utils/endpoints";

export function ProfileLayout() {
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    timezone: "UTC-8",
    picture: "" as string | null,
  });

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [pendingAvatarURL, setPendingAvatarURL] = useState<string | null>(null);
  const [pendingAvatarMeta, setPendingAvatarMeta] = useState<{ style: string; seed: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const AVATAR_STYLES = ["thumbs", "lorelei", "adventurer", "botttsNeutral", "identicon"];
  const AVATAR_SEEDS = ["eagle", "lion", "koala", "titan", "nova", "bolt", "delta"];

  const currentAvatarUrl =
    pendingAvatarURL ||
    profile.picture ||
    buildDiceBearUrl({ style: "thumbs", seed: profile.email || profile.name || "default", size: 128, extra: "&radius=50" });

  const getSettings = async () => {
    try {
      const userData = localStorage.getItem('bridge_user');
      if (!userData) return;
      const stored = JSON.parse(userData);
      const res = await fetch(`${Endpoints.SETTINGS}?userId=${stored.id}`, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.profile);
      }
    } catch (err) {
      console.error('Error fetching profile settings', err);
    }
  };

  const updateSettings = async (section: string, data: any) => {
    try {
      const userData = localStorage.getItem('bridge_user');
      if (!userData) return;
      const userStored = JSON.parse(userData);
      const response = await fetch(Endpoints.SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userStored.id, [section]: data })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success) {
        if (section === 'profile') {
          // update auth context so menu/profile picture updates instantly
          updateUser(data);
        }
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        await getSettings();
      }
    } catch (err) {
      console.error('Error updating profile', err);
    }
  };

  useEffect(() => { getSettings(); }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Header />
      <Banner title="Profile" subtitle="Edit your public profile and avatar" />

      {showNotification && (
        <div className="fixed top-20 right-4 z-9999">
          <NotificationBanner message="Profile Updated! 🎉" type="success" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card shadow="sm" radius="lg" className="bg-white border border-neutral-200/50 shadow-lg">
          <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
            <h2 className="text-xl font-semibold text-neutral-900">Profile Information</h2>
            <p className="text-sm text-neutral-500">Update your profile details and personal information.</p>
          </CardHeader>
          <CardBody className="space-y-6 px-6 pb-6">
            <div className="flex items-center gap-4">
              <img src={currentAvatarUrl} alt="Profile" width={96} height={96} className="rounded-full shadow-sm ring-2 ring-neutral-200" />
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-9 px-4 text-sm font-medium shadow-sm rounded-lg bg-white border border-neutral-300" onPress={() => setAvatarOpen(true)}>Change</Button>
                {pendingAvatarURL && <span className="text-sm text-neutral-500">Selected (not saved)</span>}
              </div>
            </div>

            {avatarOpen && (
              <div role="dialog" aria-modal="true" className="fixed inset-0 z-1000 grid place-items-center bg-black/40 p-4">
                <div className="w-full max-w-3xl bg-white rounded-2xl border border-neutral-200 shadow-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Choose an avatar</h3>
                    <button className="text-sm text-neutral-500 hover:text-neutral-700" onClick={() => setAvatarOpen(false)}>Close</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {AVATAR_STYLES.map((s) => (
                      <button key={s} onClick={() => {
                        const url = buildDiceBearUrl({ style: s, seed: AVATAR_SEEDS[0], size: 256, extra: "&radius=50" });
                        setPendingAvatarURL(url);
                        setPendingAvatarMeta({ style: s, seed: AVATAR_SEEDS[0] });
                      }} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-neutral-50">{s}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {AVATAR_SEEDS.map((sd) => {
                      const style = (pendingAvatarMeta?.style) || "thumbs";
                      const url = buildDiceBearUrl({ style, seed: sd, size: 128, extra: "&radius=50" });
                      const isActive = pendingAvatarMeta?.seed === sd;
                      return (
                        <button key={`${style}-${sd}`} onClick={() => { setPendingAvatarURL(url); setPendingAvatarMeta({ style, seed: sd }); }} className={`p-1 rounded-xl border ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-neutral-200"} bg-white hover:shadow`} title={`${style} • ${sd}`} aria-label={`Choose ${style} ${sd}`}>
                          <img src={url} alt={`${style} ${sd}`} className="rounded-full w-24 h-24 mx-auto" loading="lazy" />
                          <div className="text-center text-xs mt-1 text-neutral-600">{sd}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="bordered" className="border-neutral-300" onPress={() => { setAvatarOpen(false); setPendingAvatarURL(null); setPendingAvatarMeta(null); }}>Cancel</Button>
                    <Button color="primary" onPress={() => { if (!pendingAvatarURL) return; setProfile((p) => ({ ...p, picture: pendingAvatarURL })); setAvatarOpen(false); }} isDisabled={!pendingAvatarURL}>Use This Avatar</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-neutral-700">Full Name</label>
                <Input id="name" variant="bordered" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</label>
                <Input id="email" type="email" variant="bordered" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-neutral-700">Bio</label>
              <Textarea id="bio" variant="bordered" minRows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>

            <div className="flex justify-end w-full">
              <Button color="primary" size="md" className="h-9 px-4 text-sm font-medium" onClick={() => updateSettings('profile', { name: profile.name, email: profile.email, bio: profile.bio, timezone: profile.timezone, picture: profile.picture })}>Save Profile</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ProfileLayout;
