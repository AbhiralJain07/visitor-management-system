import React from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { OTPVerificationForm } from '@/features/auth/components/OTPVerificationForm';

export const OTPVerificationPage: React.FC = () => {
  return (
    <AuthCard
      title="Secure Verification"
      description="Two-Factor Authentication (2FA) is enabled for your account. Please enter the 6-digit code sent to your registered device."
    >
      <OTPVerificationForm />
    </AuthCard>
  );
};

export default OTPVerificationPage;
