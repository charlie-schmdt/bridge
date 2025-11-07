import React from 'react';
import ReactDOM from 'react-dom/client';
import "../index.css";
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/renderer/AppLayout';
import { HomeLayout, homeLoader } from './HomeLayout';
import { SettingsLayout } from './SettingsLayout';
import ProfileLayout from './ProfileLayout';
import OnboardingLayout from './OnboardingLayout';
import { VideoLayout } from './VideoLayout';
import { AudioSandbox } from './AudioSandbox';
import { WorkspaceLayout } from './WorkspaceLayout';
import LogInLayout from './LogInLayout';
import  RoomLayout  from './RoomLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import FAQLayout from "./FAQLayout";
import AuthCallback from './AuthCallback';
import { AudioContextProvider } from './contexts/AudioContext';
import { ToastProvider } from '@heroui/react';
import WaitingRoom from './components/WaitingRoom';
import TestWaitingRoomCall from './components/TestWaitingRoomCall';


const router = createHashRouter([
  {
    path: "/login",
    element: <LogInLayout />
  },
  {
    path: 'faq',
    element: <FAQLayout />
  },
  {
        path: 'auth/callback',
        element: <AuthCallback />
        
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        // Default protected route goes to home
        index: true,
        loader: homeLoader,
        element: <HomeLayout />,
      },
      {
        path: 'onboarding',
        element: <OnboardingLayout />,
      },
      {
        path: 'profile',
        element: <ProfileLayout />,
      },
      {
        path: 'profile/:userId',
        element: <ProfileLayout />,
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
      },
      {
        path: 'video',
        element: <VideoLayout />
      },
      {
        path: 'TestRoom/:roomId?',
        element: <RoomLayout />
      },
      {
        path: 'TestWaitingRoom',
        element: <TestWaitingRoomCall />
      }
      ,
      {
        path: 'audiosandbox',
        element: <AudioSandbox />
      }
      ,
      {
        path: 'workspace/:workspaceId',
        element: <WorkspaceLayout />
      },
      {
        path: 'faq',
        element: <FAQLayout />
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider />
    <AuthProvider>
      <AudioContextProvider>
        <RouterProvider router={router} />
      </AudioContextProvider>
    </AuthProvider>
  </React.StrictMode>
);
