import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { Endpoints } from '@/utils/endpoints';

type Step = {
  id: string;
  title: string;
  body: string;
  path: string;
  selector?: string; // optional CSS selector to highlight on the page
};

const STEPS: Step[] = [
  {
    id: 'workspaces',
    title: 'Workspaces',
    body: 'This is your workspace — see rooms, members, and important info here.',
    path: '/workspace',
    selector: '.workspace-app'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    body: 'Edit your profile information and avatar on the Profile page.',
    path: '/profile',
    selector: '.max-w-6xl'
  },
  {
    id: 'settings',
    title: 'Settings',
    body: 'Manage preferences like notifications and privacy in Settings.',
    path: '/settings',
    selector: '.max-w-6xl'
  }
];

const OnboardingTour: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipStyleState, setTooltipStyleState] = useState<React.CSSProperties | null>(null);
  const [resizeTick, setResizeTick] = useState(0);

  // start when user present and onboarding not completed
  // but don't activate the overlay if the dedicated /onboarding page is mounted
  // Only set the initial index when the overlay transitions from inactive -> active
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (!user) {
      setActive(false);
      return;
    }

    const onOnboardingPage = location && location.pathname === '/onboarding';
    // Treat missing/undefined onboarding flag as "not completed" so the tour
    // reliably shows for users who haven't completed onboarding yet.
    const hasCompleted = !!user.onboarding_completed;
    const shouldBeActive = !hasCompleted && !onOnboardingPage;

    // Only transition into active state (and initialize index) when previously inactive
    if (shouldBeActive && !activeRef.current) {
      console.log('OnboardingTour: activating overlay (user present, not completed)', { user });
      setActive(true);
      setIndex(0);
      return;
    }

    // If we should not be active but currently are, deactivate
    if (!shouldBeActive && activeRef.current) {
      console.log('OnboardingTour: deactivating overlay (completed or on onboarding page)', { hasCompleted, path: location?.pathname, user });
      setActive(false);
      return;
    }

    // Otherwise, leave active/index alone (prevents resetting index on route changes)
    console.log('OnboardingTour: no change to active state', { shouldBeActive, active: activeRef.current, path: location?.pathname });
  }, [user, location]);

  // when step changes, navigate to step.path and compute target position
  useEffect(() => {
    if (!active) return;
    const step = STEPS[index];
    if (!step) return;
  console.log('OnboardingTour: stepping to index', index, 'step', step);
  // navigate to the step's path
  console.log('OnboardingTour: navigating to', step.path);
    navigate(step.path);

    // small delay to wait for page to render
    const t = setTimeout(() => locateTarget(step.selector), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index]);

  // try to find target element bounding rect
  const locateTarget = (selector?: string) => {
    if (!selector) {
      setTargetRect(null);
      return;
    }

    // try multiple times in case component loads slowly
    let attempts = 0;
    const maxAttempts = 8;
    const interval = setInterval(() => {
      attempts += 1;
      const el = document.querySelector(selector);
  console.log('OnboardingTour: locateTarget attempt', attempts, 'selector', selector, 'found', !!el);
      if (el) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        // ensure the target is visible on screen so the tooltip can be positioned correctly
        try { (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); } catch (e) { /* ignore */ }
        setTargetRect(rect);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.log('OnboardingTour: locateTarget failed to find selector after attempts', { selector, attempts });
        setTargetRect(null);
        clearInterval(interval);
      }
    }, 300);
  };

  const next = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    console.log('OnboardingTour: active changed', { active, index });
  }, [active, index]);

  // compute tooltip position, clamped to viewport so it never renders off-screen
  useEffect(() => {
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const tooltipMaxWidth = targetRect ? 360 : 640;
    const padding = 12;

    if (!targetRect) {
      // center in the viewport (both horizontally and vertically) so resizing keeps it centered
      setTooltipStyleState({
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999,
        maxWidth: tooltipMaxWidth
      });
      return;
    }

    // estimate tooltip height if not yet measured
    const estHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 160;

    // try to place to the right of target
    let left = Math.max(padding, targetRect.left + targetRect.width + 12);
    let top = Math.max(padding, targetRect.top);

    // if placing to right would overflow, try left side
    if (left + tooltipMaxWidth + padding > viewportW) {
      const leftAlt = targetRect.left - tooltipMaxWidth - 12;
      if (leftAlt > padding) {
        left = leftAlt;
      } else {
        // center above/below the target
        left = Math.min(Math.max(padding, targetRect.left + (targetRect.width - tooltipMaxWidth) / 2), viewportW - tooltipMaxWidth - padding);
      }
    }

    // if tooltip would overflow bottom, try placing it above the target
    if (top + estHeight + padding > viewportH) {
      const topAlt = targetRect.top - estHeight - 12;
      if (topAlt > padding) {
        top = topAlt;
      } else {
        top = Math.max(padding, viewportH - estHeight - padding);
      }
    }

    setTooltipStyleState({ position: 'fixed', left, top, zIndex: 99999, maxWidth: tooltipMaxWidth });
  }, [targetRect, index, resizeTick]);

  // keep tooltip positioned on window resize
  useEffect(() => {
    const onResize = () => setResizeTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const finish = async () => {
    if (!user) return setActive(false);
    try {
      const token = localStorage.getItem('bridge_token');
      await fetch(`${Endpoints.USERS}${user.id}/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: true })
      });
    } catch (err) {
      console.error('Onboarding completion failed', err);
    } finally {
      updateUser({ onboarding_completed: true });
      setActive(false);
    }
  };

  const skip = () => {
    // mark locally as completed (and try backend async)
    finish();
  };

  if (!active) return null;

  const step = STEPS[index] || STEPS[0];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* optional highlight box */}
      {targetRect && (
        <div style={{ position: 'fixed', left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12, borderRadius: 8, boxShadow: '0 0 0 4px rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.9)', zIndex: 99998, pointerEvents: 'none' }} />
      )}

      {/* tooltip / controls (pointer-events enabled) */}
      <div ref={(el) => (tooltipRef.current = el)} style={tooltipStyleState || {}} className="pointer-events-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-neutral-600 mt-1">{step.body}</p>
            </div>
            <div className="ml-4">
              <button onClick={skip} className="text-sm text-neutral-500">Skip</button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <small className="text-xs text-neutral-500">Step {index + 1} of {STEPS.length}</small>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="bordered" onPress={prev} isDisabled={index === 0}>Back</Button>
              {index < STEPS.length - 1 ? (
                <Button color="primary" onPress={next}>Next</Button>
              ) : (
                <Button color="primary" onPress={finish}>Finish</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
