// src/pages/SettingsLayout.tsx
import { useEffect, useState } from "react";
import {
  Tabs, Tab,
  Card, CardHeader, CardBody,
  Input, Textarea, Button,
  Select, SelectItem, Switch
} from "@heroui/react";
import { Bell, User, Lock, Palette } from "lucide-react";
import Banner from "./components/Banner";
import Header from "./components/Header";
import { useAuth } from "./contexts/AuthContext";
import NotificationBanner from "./components/NotificationBanner";
import { buildDiceBearUrl } from "../utils/buildDiceBearURL";

export function SettingsLayout() {
  const { user, logout, updateUser } = useAuth();
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    timezone: "UTC-8",
    picture: "" as string | null,
  });
  

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    meetingReminders: true,
    weeklyDigest: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "team",
    showOnlineStatus: true,
    allowDirectMessages: true,
  });

  const AVATAR_STYLES = ["thumbs", "lorelei", "adventurer", "botttsNeutral", "identicon"];
  const AVATAR_SEEDS = ["eagle", "lion", "koala", "titan", "nova", "bolt", "delta"];
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [pendingAvatarURL, setPendingAvatarURL] = useState<string | null>(null);
  const [pendingAvatarMeta, setPendingAvatarMeta] = useState<{ style: string; seed: string } | null>(null);

  const currentAvatarUrl =
    pendingAvatarURL ||
    profile.picture ||
    buildDiceBearUrl({ style: "thumbs", seed: profile.email || profile.name || "default", size: 128, extra: "&radius=50" });

  // Retrieve user settings from backend 
  const getSettings = async () => {
    try {
      console.log('Fetching settings...');
      const userData = localStorage.getItem('bridge_user');
      if (!userData) {
        console.error('No user data found');
        return;
      }
      const user = JSON.parse(userData);
      console.log('User ID:', user.id);
      const response = await fetch(`http://localhost:3000/api/settings?userId=${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Response:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data:', data);
      if (data.success) {
        setProfile(data.data.profile);
        setNotifications(data.data.notifications);
        setPrivacy(data.data.privacy);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

const updateSettings = async (section: string, data: any) => {
  try {
    console.log(`Updating ${section}...`, data);
    const userData = localStorage.getItem('bridge_user');
    if (!userData) {
      console.error('No user data found');
      return;
    }
    const user = JSON.parse(userData);
    const response =  await fetch('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: user.id,
        [section]: data 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      console.log(`${section} updated successfully`);
      
      // Update auth context if profile section was updated
      if (section === 'profile') {
        updateUser(data);
      }
      
      // Show success banner
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Refresh the settings
      await getSettings();
    }
  } catch (error) {
    console.error(`Error updating ${section}:`, error);
  }
};

useEffect(() => {
  getSettings();
}, []);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const isOAuthUser = user?.provider === 'google';
  
  const handleStartDelete = () => {
    setShowDeleteForm(true);
    setDeleteStep(isOAuthUser ? 2 : 1);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteError('');
  };

  const handleCancelDelete = () => {
    setShowDeleteForm(false);
    setDeleteStep(isOAuthUser ? 2 : 1);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteError('');
    setIsDeleting(false);
  };

  const handlePasswordNext = () => {
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password');
      return;
    }
    setDeleteStep(2);
    setDeleteError('');
  };

  const handleFinalDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('You must type "DELETE" exactly');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('bridge_token');
      
      const requestBody = isOAuthUser ? {} : { password: deletePassword };
      
      const response = await fetch('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        await logout();
        window.location.hash = '#/login';
      } else {
        setDeleteError(data.message || 'Failed to delete account');
      }

    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteError('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (

    <div className="min-h-screen bg-[#f9fafb]">
      <Header />
      <Banner
        title="Settings"
        subtitle="Manage your account and preferences"
      />
      {/* Notification Banner */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-[9999]">
          <NotificationBanner message="Settings Updated! 🎉" type="success" />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          fullWidth
          aria-label="Settings Tabs"
          variant="solid"
          color="default"
          defaultSelectedKey="profile"
          classNames={{
            tabList: "grid w-full grid-cols-4 bg-neutral-200/80 backdrop-blur-sm border border-neutral-300 rounded-2xl p-1.5 shadow-sm",
            tab: "rounded-xl data-[selected=true]:bg-white data-[selected=true]:shadow-md transition-all duration-200",
            tabContent: "flex items-center gap-2 font-medium text-neutral-600 data-[selected=true]:text-neutral-900",
          }}
          className="space-y-8"
        >
          {/* Profile Tab */}
          <Tab
            key="profile"
            title={
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </span>
            }
          >
            <Card
              shadow="sm"
              radius="lg"
              className="bg-white border border-neutral-200/50 shadow-lg"
            >
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold text-neutral-900">Profile Information</h2>
                <p className="text-sm text-neutral-500">
                  Update your profile details and personal information.
                </p>
              </CardHeader>

              <CardBody className="space-y-6 px-6 pb-6">

                {/*  Avatar Picker UI (Preview + Change + Modal) DICEBEAR LIBRARY/API */}

                <div className="flex items-center gap-4">
                  <img
                    src={currentAvatarUrl}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="rounded-full shadow-sm ring-2 ring-neutral-200"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-9 px-4 text-sm font-medium shadow-sm rounded-lg bg-white border border-neutral-300"
                      onPress={() => setAvatarOpen(true)}
                    >
                      Change
                    </Button>
                    {pendingAvatarURL && (
                      <span className="text-sm text-neutral-500">Selected (not saved)</span>
                    )}
                  </div>
                </div>

                {/* Simple modal overlay */}
                {avatarOpen && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4"
                  >
                    <div className="w-full max-w-3xl bg-white rounded-2xl border border-neutral-200 shadow-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Choose an avatar</h3>
                        <button
                          className="text-sm text-neutral-500 hover:text-neutral-700"
                          onClick={() => setAvatarOpen(false)}
                        >
                          Close
                        </button>
                      </div>

                      {/* Style chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {AVATAR_STYLES.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              // preview first seed when switching styles
                              const url = buildDiceBearUrl({ style: s, seed: AVATAR_SEEDS[0], size: 256, extra: "&radius=50" });
                              setPendingAvatarURL(url);
                              setPendingAvatarMeta({ style: s, seed: AVATAR_SEEDS[0] });
                              console.log('Style selected:', s);
                              console.log('URL:', url);
                            }}
                            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-neutral-50"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Grid of seeds for currently “active” or last-picked style */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {AVATAR_SEEDS.map((sd) => {
                          const style = (pendingAvatarMeta?.style) || "thumbs";
                          const url = buildDiceBearUrl({ style, seed: sd, size: 128, extra: "&radius=50" });
                          const isActive = pendingAvatarMeta?.seed === sd;
                          return (
                            <button
                              key={`${style}-${sd}`}
                              onClick={() => {
                                setPendingAvatarURL(url);
                                setPendingAvatarMeta({ style, seed: sd });
                              }}
                              className={`p-1 rounded-xl border ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-neutral-200"} bg-white hover:shadow`}
                              title={`${style} • ${sd}`}
                              aria-label={`Choose ${style} ${sd}`}
                            >
                              <img
                                src={url}
                                alt={`${style} ${sd}`}
                                className="rounded-full w-24 h-24 mx-auto"
                                loading="lazy"
                              />
                              <div className="text-center text-xs mt-1 text-neutral-600">{sd}</div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="bordered"
                          className="border-neutral-300"
                          onPress={() => {
                            setAvatarOpen(false);
                            setPendingAvatarURL(null);
                            setPendingAvatarMeta(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="primary"
                          onPress={() => {
                            if (!pendingAvatarURL) return;
                            // Apply to local profile immediately; persist on Save button below
                            setProfile((p) => ({ ...p, picture: pendingAvatarURL }));
                            setAvatarOpen(false);
                          }}
                          isDisabled={!pendingAvatarURL}
                        >
                          Use This Avatar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-neutral-700">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      variant="bordered"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      classNames={{
                        inputWrapper: "bg-neutral-50 border border-neutral-200 focus-within:border-primary rounded-lg shadow-sm transition-colors",
                        input: "text-neutral-900 placeholder:text-neutral-500 focus:outline-none",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      variant="bordered"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      classNames={{
                        inputWrapper: "bg-neutral-50 border border-neutral-200 focus-within:border-primary rounded-lg shadow-sm transition-colors",
                        input: "text-neutral-900 placeholder:text-neutral-500 focus:outline-none",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium text-neutral-700">
                    Bio
                  </label>
                  <Textarea
                    id="bio"
                    variant="bordered"
                    minRows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    classNames={{
                      inputWrapper: "bg-neutral-50 border border-neutral-200 focus-within:border-primary rounded-lg shadow-sm transition-colors",
                      input: "text-neutral-900 placeholder:text-neutral-500 focus:outline-none",
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Timezone</label>
                  <Select
                    aria-label="Timezone"
                    className="max-w-[200px]"
                    selectedKeys={[profile.timezone]}
                    onSelectionChange={(keys) =>
                      setProfile({ ...profile, timezone: Array.from(keys)[0] as string })
                    }
                    variant="bordered"
                    classNames={{
                      trigger: "bg-neutral-50 border border-neutral-200 focus:border-primary rounded-lg shadow-sm transition-colors flex justify-between items-center cursor-pointer",
                      value: "text-neutral-900",
                      popoverContent: "bg-white shadow-lg border border-neutral-200 rounded-lg bg-white w-fit",
                    }}
                  >
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="UTC-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="UTC-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="UTC-5">Eastern Time (UTC-5)</SelectItem>
                  </Select>
                </div>

                {/* DELETE ACCOUNT SECTION */}
                <div className="border-t border-red-200 bg-red-50 p-4 rounded-lg mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      This will permanently delete your account and all data. This action cannot be undone.
                    </p>
                  </div>

                  {!showDeleteForm ? (
                    <Button
                      size="md"
                      className="h-9 px-4 text-sm font-medium shadow-lg border border-red-300 rounded-lg bg-white text-red-600 hover:text-red-700 hover:bg-red-100"
                      fullWidth={false}
                      onPress={handleStartDelete}
                    >
                      Delete Account
                    </Button>
                  ) : (
                    // Inline delete form (GitHub/AWS style)
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-red-300">
                      {deleteStep === 1 && !isOAuthUser ? (
                        // Step 1: Password verification (only for password users)
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Step 1</span>
                            Verify your identity
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <Input
                              type="password"
                              placeholder="Enter your current password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              isDisabled={isDeleting}
                              size="sm"
                              classNames={{
                                inputWrapper: "border border-gray-300"
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Enter your current account password to verify your identity
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="bordered"
                              onPress={handleCancelDelete}
                              isDisabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              color="primary"
                              onPress={handlePasswordNext}
                              isDisabled={isDeleting || !deletePassword.trim()}
                            >
                              Continue
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Step 2: Final confirmation (or only step for OAuth users)
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            {isOAuthUser ? (
                              <>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">OAuth User</span>
                                Confirm deletion
                              </>
                            ) : (
                              <>
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Step 2</span>
                                Final confirmation
                              </>
                            )}
                          </div>
                          
                          {isOAuthUser && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                <strong>OAuth Account:</strong> You're signed in with Google, so no password verification is needed.
                              </p>
                            </div>
                          )}
                          
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800 font-medium">
                              This action cannot be undone. All your data will be permanently deleted.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Type "DELETE" to confirm
                            </label>
                            <Input
                              placeholder='Type "DELETE" to confirm'
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              isDisabled={isDeleting}
                              size="sm"
                              classNames={{
                                inputWrapper: "border border-gray-300"
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            {!isOAuthUser && (
                              <Button
                                size="sm"
                                variant="bordered"
                                onPress={() => setDeleteStep(1)}
                                isDisabled={isDeleting}
                              >
                                Back
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="bordered"
                              onPress={handleCancelDelete}
                              isDisabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              onPress={handleFinalDelete}
                              isLoading={isDeleting}
                              isDisabled={deleteConfirmText !== 'DELETE'}
                            >
                              {isDeleting ? "Deleting..." : "Delete Account"}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {deleteError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-600">{deleteError}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SAVE CHANGES BUTTON */}
                <div className="flex justify-end w-full">
                  <Button
                    color="primary"
                    size="md"
                    className="h-9 px-4 text-sm font-medium shadow-sm w-fit inline-flex self-start rounded-lg bg-blue-600 text-white py-2"
                    fullWidth={false}
                    onClick={() => updateSettings('profile', {
                      name: profile.name,
                      email: profile.email,
                      bio: profile.bio,
                      timezone: profile.timezone,
                      picture: profile.picture
                    })}
                >
                    Save Appearance Settings
                </Button>
            </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Notifications Tab */}
          <Tab
            key="notifications"
            title={
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </span>
            }
          >
            <Card shadow="sm" radius="lg" className="bg-white border border-neutral-200/50 shadow-lg">
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold text-neutral-900">Notification Preferences</h2>
                <p className="text-sm text-neutral-500">
                  Choose how you want to be notified about workspace activities.
                </p>
              </CardHeader>
              <CardBody className="space-y-6 px-6 pb-6">
                <SettingRow
                  title="Email Notifications"
                  description="Receive email notifications for important updates"
                  isSelected={notifications.emailNotifications}
                  onChange={(v) => setNotifications({ ...notifications, emailNotifications: v })}
                />
                <SettingRow
                  title="Push Notifications"
                  description="Get push notifications on your device"
                  isSelected={notifications.pushNotifications}
                  onChange={(v) => setNotifications({ ...notifications, pushNotifications: v })}
                />
                <SettingRow
                  title="Meeting Reminders"
                  description="Receive reminders before scheduled meetings"
                  isSelected={notifications.meetingReminders}
                  onChange={(v) => setNotifications({ ...notifications, meetingReminders: v })}
                />
                <SettingRow
                  title="Weekly Digest"
                  description="Get a weekly summary of your workspace activity"
                  isSelected={notifications.weeklyDigest}
                  onChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })}
                />
                <div className="flex justify-end w-full">
                  <Button
                    color="primary"
                    size="md"
                    className="h-9 px-4 text-sm font-medium shadow-sm w-fit inline-flex self-start rounded-lg bg-blue-600 text-white py-2"
                    fullWidth={false}
                    onClick={() => updateSettings('notifications', notifications)}
                  >
                    Save Preferences
                </Button>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Privacy Tab */}
          <Tab
            key="privacy"
            title={
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </span>
            }
          >
            <Card shadow="sm" radius="lg" className="bg-white border border-neutral-200/50 shadow-lg">
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold text-neutral-900">Privacy & Security</h2>
                <p className="text-sm text-neutral-500">
                  Control your privacy settings and who can see your information.
                </p>
              </CardHeader>
              <CardBody className="space-y-6 px-6 pb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Profile Visibility</label>
                  <Select
                    aria-label="Profile Visibility"
                    selectedKeys={[privacy.profileVisibility]}
                    onSelectionChange={(keys) =>
                      setPrivacy({ ...privacy, profileVisibility: Array.from(keys)[0] as string })
                    }
                    variant="bordered"
                    className="max-w-md"
                    classNames={{
                      trigger: "bg-neutral-50 border border-neutral-200 focus:border-primary rounded-lg shadow-sm transition-colors flex justify-between items-center cursor-pointer",
                      value: "text-neutral-900",
                      popoverContent: "shadow-lg border border-neutral-200 rounded-lg bg-white",
                    }}
                  >
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="public">Public - Anyone can see your profile</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="team">Team Only - Only team members can see your profile</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="private">Private - Profile is hidden</SelectItem>
                  </Select>
                </div>

                <SettingRow
                  title="Show Online Status"
                  description="Let others see when you're online"
                  isSelected={privacy.showOnlineStatus}
                  onChange={(v) => setPrivacy({ ...privacy, showOnlineStatus: v })}
                />
                <SettingRow
                  title="Allow Direct Messages"
                  description="Allow team members to send you direct messages"
                  isSelected={privacy.allowDirectMessages}
                  onChange={(v) => setPrivacy({ ...privacy, allowDirectMessages: v })}
                />

              <div className="flex justify-end w-full">
                <Button
                  color="primary"
                  size="md"
                  className="h-9 px-4 text-sm font-medium shadow-sm w-fit inline-flex self-start rounded-lg bg-blue-600 text-white py-2"
                  fullWidth={false}
                  onClick={() => updateSettings('privacy', privacy)}
                >
                  Update Privacy Settings
                </Button>
              </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Appearance Tab */}
          <Tab
            key="appearance"
            title={
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </span>
            }
          >
            <Card shadow="sm" radius="lg" className="bg-white border border-neutral-200/50 shadow-lg">
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold text-neutral-900">Appearance</h2>
                <p className="text-sm text-neutral-500">
                  Customize how the application looks and feels.
                </p>
              </CardHeader>
              <CardBody className="space-y-6 px-6 pb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Theme</label>
                  <Select
                    aria-label="Theme"
                    defaultSelectedKeys={["light"]}
                    variant="bordered"
                    className="max-w-[200px]"
                    classNames={{
                      trigger: "bg-neutral-50 border border-neutral-200 focus:border-primary rounded-lg shadow-sm transition-colors flex justify-between items-center cursor-pointer",
                      value: "text-neutral-900",
                      popoverContent: "shadow-lg border border-neutral-200 rounded-lg bg-white w-fit",
                    }}
                  >
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="light">Light Mode</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="dark">Dark Mode</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="system">System Default</SelectItem>
                  </Select>
                </div>
              <div className="flex justify-end w-full">
                <Button
                  color="primary"
                  size="md"
                  className="h-9 px-4 text-sm font-medium shadow-sm w-fit inline-flex self-start rounded-lg bg-blue-600 text-white py-2"
                  fullWidth={false}
                  onClick={() => updateSettings('appearance', {
                    theme: 'system' // You might want to add a state for this
                  })}
                >
                  Save Appearance Settings
                </Button>
              </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

interface SettingRowProps {
  title: string;
  description: string;
  isSelected: boolean;
  onChange: (value: boolean) => void;
}

import Toggle from "./components/Toggle";   // adjust path if needed

const SettingRow = ({ title, description, isSelected, onChange }: SettingRowProps) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-neutral-900">{title}</div>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>

      <Toggle checked={isSelected} onChange={onChange} />
    </div>
  );
};

