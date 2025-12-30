import { useEffect } from 'react';

/**
 * Custom hook to dynamically update the browser document title
 * @param title - The title to display (will be appended with " | SnapChef")
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | SnapChef` : 'SnapChef';

    // Cleanup: restore previous title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
