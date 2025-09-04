import React, { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
