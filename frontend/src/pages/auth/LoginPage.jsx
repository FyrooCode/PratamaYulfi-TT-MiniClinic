import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/features/auth/LoginForm';
import loginIllustration from '@/assets/images/login_image.png';

export default function LoginPage() {
  const { user, loading } = useAuth();

  // If session is already active, redirect immediately to relevant page
  if (!loading && user) {
    return <Navigate to={user.role === 'doctor' ? '/examination' : '/dashboard'} replace />;
  }
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 justify-center">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block overflow-hidden">
        <img
          src={loginIllustration}
          alt="Visual"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3] dark:grayscale"
        />
      </div>
    </div>
  );
}
