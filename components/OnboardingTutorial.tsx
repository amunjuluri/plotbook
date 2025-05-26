"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  BarChart3, 
  Heart, 
  Users, 
  Search, 
  TrendingUp,
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  feature: string;
  benefits: string[];
  action?: string;
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  userPermissions?: {
    canAccessDashboard?: boolean;
    canAccessSavedProperties?: boolean;
    canAccessTeamManagement?: boolean;
  };
}

const allSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to Plotbook!",
    description: "Your comprehensive property intelligence platform. Let's explore what you can do.",
    icon: Sparkles,
    feature: "Getting Started",
    benefits: [
      "Access millions of property records",
      "Advanced analytics and insights",
      "Collaborative team features"
    ]
  },
  {
    id: 2,
    title: "Interactive Property Explorer",
    description: "Search and discover properties across the country with our powerful map interface.",
    icon: MapPin,
    feature: "Map Search",
    benefits: [
      "Visual property exploration",
      "Filter by value, type, and location",
      "Real-time property data"
    ],
    action: "Try searching for properties in your area"
  },
  {
    id: 3,
    title: "Analytics Dashboard",
    description: "Get insights into property markets, trends, and comprehensive statistics.",
    icon: BarChart3,
    feature: "Dashboard Analytics",
    benefits: [
      "Market trend analysis",
      "Property value insights",
      "Portfolio performance tracking"
    ],
    action: "View your personalized dashboard"
  },
  {
    id: 4,
    title: "Save & Organize Properties",
    description: "Save interesting properties and organize them with custom tags for easy retrieval.",
    icon: Heart,
    feature: "Property Collections",
    benefits: [
      "Bookmark favorite properties",
      "Organize with custom tags",
      "Export saved collections"
    ],
    action: "Start building your property collection"
  },
  {
    id: 5,
    title: "Team Collaboration",
    description: "Invite team members and manage permissions for collaborative property research.",
    icon: Users,
    feature: "Team Management",
    benefits: [
      "Invite team members",
      "Role-based permissions",
      "Shared property collections"
    ],
    action: "Set up your team workspace"
  }
];

export function OnboardingTutorial({ isOpen, onClose, userPermissions }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Filter steps based on user permissions
  const availableSteps = allSteps.filter(step => {
    switch (step.id) {
      case 3: // Dashboard
        return userPermissions?.canAccessDashboard !== false;
      case 4: // Saved Properties
        return userPermissions?.canAccessSavedProperties !== false;
      case 5: // Team Management
        return userPermissions?.canAccessTeamManagement === true;
      default:
        return true; // Welcome and Map Search are always available
    }
  });

  const totalSteps = availableSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      setTimeout(() => {
        handleComplete();
      }, 2000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('plotbook_onboarding_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('plotbook_onboarding_completed', 'true');
    onClose();
  };

  // Reset tutorial state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsCompleted(false);
    }
  }, [isOpen]);

  // Check if onboarding was already completed - only auto-close on initial load, not manual trigger
  useEffect(() => {
    // Remove the auto-close behavior - let users manually restart tutorial
  }, [isOpen, onClose]);

  // Add keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentStep, totalSteps, isCompleted]);

  if (!isOpen) return null;

  const currentStepData = availableSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] max-h-[900px] sm:h-[85vh] sm:max-h-[800px] p-0 overflow-hidden border-0 shadow-2xl mx-4 sm:mx-auto">
        <motion.div 
          className="h-full flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                    Getting Started with Plotbook
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 text-sm">
                    Learn how to make the most of your property intelligence platform
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 self-start sm:self-auto">
                {currentStep + 1} of {totalSteps}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-100">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="bg-white/20" />
            </div>
          </div>

          {/* Content - with controlled height and scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 sm:p-8 h-full">
              <AnimatePresence mode="wait">
                {!isCompleted ? (
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col lg:flex-row gap-6 lg:gap-0 min-h-[400px]"
                  >
                    {/* Left side - Content */}
                    <div className="flex-1 lg:pr-8">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center self-start sm:self-auto">
                          <currentStepData.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                            {currentStepData.title}
                          </h2>
                          <Badge variant="outline" className="text-xs">
                            {currentStepData.feature}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                        {currentStepData.description}
                      </p>

                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                            Key Benefits
                          </h3>
                          <div className="grid gap-2 sm:gap-3">
                            {currentStepData.benefits.map((benefit, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg"
                              >
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {currentStepData.action && (
                          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 font-medium flex items-center text-sm sm:text-base">
                              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                              Quick Action: {currentStepData.action}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Visual (hidden on mobile, reduced size) */}
                    <div className="hidden lg:flex w-64 items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="w-48 h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center relative overflow-hidden"
                      >
                        <currentStepData.icon className="w-20 h-20 text-blue-600" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center px-4 min-h-[400px]"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6"
                    >
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                      You're All Set! 🎉
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-md">
                      Congratulations! You're now ready to explore the full power of Plotbook. 
                      Happy property hunting!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer - always visible at bottom */}
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-800 w-full sm:w-auto"
                >
                  Skip Tutorial
                </Button>
                
                {/* Keyboard hints - hidden on mobile */}
                <div className="hidden lg:flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">←</kbd>
                    <span>Previous</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">→</kbd>
                    <span>Next</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">Esc</kbd>
                    <span>Skip</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isCompleted}
                  className="flex items-center flex-1 sm:flex-none"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden xs:inline">Previous</span>
                  <span className="xs:hidden">Prev</span>
                </Button>
                
                <Button
                  onClick={isCompleted ? handleComplete : handleNext}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center flex-1 sm:flex-none sm:min-w-[120px]"
                  disabled={isCompleted}
                >
                  {isCompleted ? (
                    "Completing..."
                  ) : currentStep === totalSteps - 1 ? (
                    <>
                      Finish
                      <Sparkles className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span className="hidden xs:inline">Next</span>
                      <span className="xs:hidden">Next</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 