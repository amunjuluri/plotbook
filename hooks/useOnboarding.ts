"use client";

import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem('plotbook_onboarding_completed');
    setIsCompleted(completed === 'true');
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    localStorage.setItem('plotbook_onboarding_completed', 'true');
    setIsCompleted(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('plotbook_onboarding_completed', 'true');
    setIsCompleted(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('plotbook_onboarding_completed');
    setIsCompleted(false);
  };

  return {
    showOnboarding,
    isCompleted,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    setShowOnboarding
  };
} 