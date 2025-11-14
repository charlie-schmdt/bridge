import { HeroUIProvider } from '@heroui/react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import OnboardingTour from './components/OnboardingTour';

export const AppLayout = () => {

  // <Outlet /> renders child routes when they are selected
  return (
    <HeroUIProvider>
      <div className="flex flex-col min-h-screen bg-[#f9fafb]">
        <ToastContainer />
        {/* global tour overlay mounts here so it can walk across routes */}
        <OnboardingTour />

        <div className="overflow-auto h-full">
          <Outlet />
        </div>
      </div>
    </HeroUIProvider>
  )
}
