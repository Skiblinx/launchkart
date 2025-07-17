import React, { createContext, useContext, useState, useEffect } from 'react';
import { tourSteps } from '../../utils/tourSteps';
import TourTooltip from './TourTooltip';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [tourState, setTourState] = useState({
    isActive: false,
    currentStep: 0,
    steps: [],
    userRole: 'founder',
    completed: false,
    skipped: false
  });

  const [currentElement, setCurrentElement] = useState(null);

  const startTour = (userRole = 'founder') => {
    const steps = tourSteps[userRole] || tourSteps.founder;
    setTourState({
      isActive: true,
      currentStep: 0,
      steps,
      userRole,
      completed: false,
      skipped: false
    });
  };

  const checkAutoStart = (userRole) => {
    const tourCompleted = localStorage.getItem(`tour_completed_${userRole}`);
    const tourSkipped = localStorage.getItem(`tour_skipped_${userRole}`);
    
    if (!tourCompleted && !tourSkipped) {
      // Auto-start tour for new users after a delay
      setTimeout(() => {
        startTour(userRole);
      }, 2000);
    }
  };

  const nextStep = () => {
    if (tourState.currentStep < tourState.steps.length - 1) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (tourState.currentStep > 0) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const skipTour = () => {
    localStorage.setItem(`tour_skipped_${tourState.userRole}`, 'true');
    setTourState(prev => ({
      ...prev,
      isActive: false,
      skipped: true
    }));
  };

  const completeTour = () => {
    localStorage.setItem(`tour_completed_${tourState.userRole}`, 'true');
    setTourState(prev => ({
      ...prev,
      isActive: false,
      completed: true
    }));
  };

  const restartTour = () => {
    setTourState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      completed: false,
      skipped: false
    }));
  };

  // Find current step element
  useEffect(() => {
    if (tourState.isActive && tourState.steps.length > 0) {
      const currentStepData = tourState.steps[tourState.currentStep];
      const element = document.querySelector(currentStepData.target);
      setCurrentElement(element);
    } else {
      setCurrentElement(null);
    }
  }, [tourState.isActive, tourState.currentStep, tourState.steps]);

  const value = {
    tourState,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    restartTour,
    currentElement,
    checkAutoStart
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {tourState.isActive && tourState.steps.length > 0 && (
        <TourTooltip
          step={tourState.steps[tourState.currentStep]}
          currentStep={tourState.currentStep}
          totalSteps={tourState.steps.length}
          targetElement={currentElement}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          onComplete={completeTour}
        />
      )}
    </TourContext.Provider>
  );
};