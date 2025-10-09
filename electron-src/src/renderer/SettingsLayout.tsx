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

export function SettingsLayout() {

  {/* TO DO - Fetch from backend*/ }
  /*const [profile, setProfile] = useState({
    name: "Gang Violence",
    email: "user@purdue.edu",
    bio: "professional meower for hire",
    timezone: "UTC-8",
  });*/
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    timezone: "UTC-8",
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

    const response = await fetch('http://localhost:3000/api/settings', {
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

  return (

    <div className="min-h-screen bg-[#f9fafb]">
      <Header />
      <Banner
        title="Settings"
        subtitle="Manage your account and preferences"
      />

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

               <div className="flex justify-between items-center w-full pt-4"> 
        
                {/* 1. DELETE ACCOUNT BUTTON (Left Side) */}
                <Button
                  size="md"
                  className="h-9 px-4 text-sm font-medium bg-white shadow-lg border border-neutral-200 rounded-lg bg-white w-fit inline-flex self-start rounded-lg py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  fullWidth={false}
                  onClick={() => {
                      // 💡 Use window.confirm() to show the browser's native dialog
                      const isConfirmed = window.confirm(
                          "Are you sure you want to delete your account? This action is permanent."
                      );
                      
                      if (isConfirmed) {
                          // Put your actual delete logic here
                          console.log("Account Deletion Confirmed and Initiated!"); 
                          // navigate("/goodbye-page");
                      } else {
                          console.log("Deletion cancelled.");
                      }
                  }}
              >
                  Delete Account
              </Button>

                {/* 2. SAVE CHANGES BUTTON (Right Side) */}
                {/* Note: Removed the wrapping div from your previous example */}
                <Button
                    color="primary"
                    size="md"
                    className="h-9 px-4 text-sm font-medium shadow-sm w-fit inline-flex self-start rounded-lg bg-blue-600 text-white py-2"
                    fullWidth={false}
                    onClick={() => updateSettings('profile', {
                      name: profile.name,
                      email: profile.email,
                      bio: profile.bio,
                      timezone: profile.timezone
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