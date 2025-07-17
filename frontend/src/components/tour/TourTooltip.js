import React, { useEffect, useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/react';
import { ChevronLeft, ChevronRight, X, SkipForward } from 'lucide-react';

const TourTooltip = ({ 
  step, 
  currentStep, 
  totalSteps, 
  targetElement, 
  onNext, 
  onPrev, 
  onSkip, 
  onComplete 
}) => {
  const [arrowRef, setArrowRef] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    elements: {
      reference: targetElement,
    },
    placement: step.placement || 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  useEffect(() => {
    if (targetElement) {
      // Add highlight to target element
      targetElement.classList.add('tour-highlight');
      targetElement.style.position = 'relative';
      targetElement.style.zIndex = '1000';
      
      // Scroll element into view
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Show tooltip after a brief delay
      setTimeout(() => setIsVisible(true), 300);
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
      }
    };
  }, [targetElement]);

  if (!targetElement || !isVisible) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="tour-backdrop" />
      
      {/* Tooltip */}
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="tour-tooltip bg-white rounded-lg shadow-lg p-4 max-w-sm z-[1001] border border-gray-200"
      >
        {/* Arrow */}
        <div
          ref={setArrowRef}
          className="tour-tooltip-arrow"
          style={{
            left: context.middlewareData.arrow?.x,
            top: context.middlewareData.arrow?.y,
          }}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {step.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onSkip}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward size={14} />
              <span>Skip Tour</span>
            </button>
            
            <button
              onClick={isLastStep ? onComplete : onNext}
              className="tour-button flex items-center space-x-1 px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {!isLastStep && <ChevronRight size={14} />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="tour-progress bg-blue-500 h-1 rounded-full"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
};

export default TourTooltip;