import { useState, useEffect } from 'react';

// Minimalny routing SPA bez zależności — czyta window.location.pathname i słucha popstate.
// Wystarcza dla nielicznych ścieżek (aplikacja + /docs); Vite serwuje index.html w trybie SPA.
export function navigate(to) {
  if (to === window.location.pathname) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}
