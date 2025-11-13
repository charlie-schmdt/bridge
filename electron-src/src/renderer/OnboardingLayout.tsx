import { Endpoints } from '@/renderer/utils/endpoints';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const OnboardingLayout: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      title: 'Welcome to Bridge',
      body: 'Quick tour: create workspaces, invite teammates, and start collaborating.'
    },
    {
      title: 'Profiles & Avatars',
      body: 'Set up your profile picture and public info so teammates recognize you.'
    },
    {
      title: 'Notifications',
      body: 'Control how you receive updates and reminders from your workspaces.'
    }
  ];

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('bridge_token');
      const res = await fetch(`${Endpoints.USERS}${user.id}/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: true })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // update AuthContext so the app knows onboarding is done
        updateUser({ onboarding_completed: true });
        navigate('/');
      } else {
        console.error('Failed to set onboarding:', data);
        // still update locally to avoid locking users out; backend can be retried
        updateUser({ onboarding_completed: true });
        navigate('/');
      }
    } catch (err) {
      console.error('Onboarding finish error', err);
      updateUser({ onboarding_completed: true });
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card shadow="sm" radius="lg" className="bg-white border border-neutral-200/50">
          <CardHeader className="px-6 pt-6">
            <h2 className="text-xl font-semibold">{steps[step].title}</h2>
          </CardHeader>
          <CardBody className="px-6 pb-6 space-y-6">
            <p className="text-neutral-600">{steps[step].body}</p>

            <div className="flex items-center justify-between">
              <div>
                {step > 0 && (
                  <Button variant="bordered" onPress={prev} className="mr-2">Back</Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step < steps.length - 1 ? (
                  <Button color="primary" onPress={next}>Next</Button>
                ) : (
                  <Button color="primary" onPress={finish} isLoading={saving}>Finish</Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingLayout;
