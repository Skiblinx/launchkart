import { useTour as useTourContext } from '../components/tour/TourProvider';

export const useTour = () => {
  return useTourContext();
};