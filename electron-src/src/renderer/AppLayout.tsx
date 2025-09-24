import { Outlet, Link } from 'react-router-dom';
import { HeroUIProvider, Button } from '@heroui/react';

export const AppLayout = () => {

  // <Outlet /> renders child routes when they are selected
  return (
    <HeroUIProvider>
      <nav className="p-2 flex gap-2">
        <Button as={Link} to="/">Home</Button>
        <Button as={Link} to="/settings">Settings</Button>
      </nav>
      <Outlet />
    </HeroUIProvider>
  )
}
