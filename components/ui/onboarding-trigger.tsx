"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingTriggerProps {
  onStartOnboarding: () => void;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function OnboardingTrigger({ 
  onStartOnboarding, 
  variant = "ghost", 
  size = "sm",
  showIcon = true,
  children 
}: OnboardingTriggerProps) {
  const handleClick = () => {
    onStartOnboarding();
    toast.success("Starting tutorial", {
      description: "Let's walk through PlotBook's features together!",
      duration: 2000
    });
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleClick}
      className="gap-2"
    >
      {showIcon && <HelpCircle className="h-4 w-4" />}
      {children || "Help & Tutorial"}
    </Button>
  );
} 