// src/pages/SettingsLayout.tsx
import { Endpoints } from "@/utils/endpoints";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select, SelectItem,
  Tab,
  Tabs
} from "@heroui/react";
import { Bell, Lock, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import Banner from "./components/Banner";
import Header from "./components/Header";
import NotificationBanner from "./components/NotificationBanner";
import { useAuth } from "./contexts/AuthContext";

export function SettingsLayout() {
  const { user, logout, updateUser } = useAuth();

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

  const [appearance, setAppearance] = useState({
    theme: "light",
    timezone: user?.timezone || "UTC",
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
      const response = await fetch(`${Endpoints.SETTINGS}?userId=${user.id}`, {
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
        setNotifications(data.data.notifications);
        setPrivacy(data.data.privacy);
        if (data.data.appearance) {
          setAppearance(data.data.appearance);
        }
        // Update user timezone in context if available
        if (data.data.user?.timezone) {
          updateUser({ timezone: data.data.user.timezone });
        }
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
    const response =  await fetch(Endpoints.SETTINGS, {
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
      
      // Update auth context with timezone if appearance section includes timezone
      if (section === 'appearance' && data.timezone) {
        updateUser({ timezone: data.timezone });
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
      
      const response = await fetch(Endpoints.AUTH_DELETE, {
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
        <div className="fixed top-20 right-4 z-9999">
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
          defaultSelectedKey="notifications"
          classNames={{
            tabList: "grid w-full grid-cols-3 bg-neutral-200/80 backdrop-blur-sm border border-neutral-300 rounded-2xl p-1.5 shadow-sm",
            tab: "rounded-xl data-[selected=true]:bg-white data-[selected=true]:shadow-md transition-all duration-200",
            tabContent: "flex items-center gap-2 font-medium text-neutral-600 data-[selected=true]:text-neutral-900",
          }}
          className="space-y-8"
        >
          {/* Profile moved to its own page (see /profile). */}

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
                    selectedKeys={[appearance.theme]}
                    onSelectionChange={(keys) =>
                      setAppearance({ ...appearance, theme: Array.from(keys)[0] as string })
                    }
                    variant="bordered"
                    className="max-w-[200px]"
                    classNames={{
                      trigger: "bg-neutral-50 border border-neutral-200 focus:border-primary rounded-lg shadow-sm transition-colors flex justify-between items-center cursor-pointer h-14 px-4 py-3",
                      value: "text-neutral-900 text-sm leading-normal ml-6",
                      popoverContent: "shadow-lg border border-neutral-200 rounded-lg bg-white w-fit",
                    }}
                  >
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="light">Light Mode</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="dark">Dark Mode</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="system">System Default</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Timezone</label>
                  <p className="text-xs text-neutral-500 mb-2">Meeting times will be displayed in your selected timezone</p>
                  <Select
                    aria-label="Timezone"
                    selectedKeys={[appearance.timezone || user?.timezone || "UTC"]}
                    onSelectionChange={(keys) =>
                      setAppearance({ ...appearance, timezone: Array.from(keys)[0] as string })
                    }
                    variant="bordered"
                    className="max-w-md"
                    classNames={{
                      trigger: "bg-neutral-50 border border-neutral-200 focus:border-primary rounded-lg shadow-sm transition-colors flex justify-between items-center cursor-pointer h-14 px-4 py-3",
                      value: "text-neutral-900 text-sm leading-normal ml-6",
                      popoverContent: "shadow-lg border border-neutral-200 rounded-lg bg-white max-h-60 overflow-auto",
                    }}
                  >
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="UTC">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Europe/Paris">Central European Time (CET)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Europe/Athens">Eastern European Time (EET)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Asia/Dubai">Dubai (GST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Asia/Kolkata">India (IST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Asia/Shanghai">China (CST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Asia/Tokyo">Japan (JST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                    <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="Pacific/Auckland">New Zealand (NZDT/NZST)</SelectItem>
                  </Select>
                </div>
              <div className="flex justify-end w-full">
                <Button
                  color="primary"
                  size="md"
                  className="h-9 px-4 text-sm font-medium shadow-sm w-fit inline-flex self-start rounded-lg bg-blue-600 text-white py-2"
                  fullWidth={false}
                  onClick={() => updateSettings('appearance', appearance)}
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

import Toggle from "./components/Toggle"; // adjust path if needed

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

