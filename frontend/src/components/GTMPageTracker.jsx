import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pushEvent } from '../utils/gtm';

export default function GTMPageTracker() {
  const location = useLocation();

  useEffect(() => {
    pushEvent('page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location]);

  return null;
}
