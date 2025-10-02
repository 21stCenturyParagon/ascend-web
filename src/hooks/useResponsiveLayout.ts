import { useMemo } from 'react';

export default function useResponsiveLayout() {
  return useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isDesktopXL = width >= 1440;
    const inputWrapperMaxWidth = isDesktopXL ? 700 : isDesktop ? 640 : isTablet ? 685 : 500;
    const headerMaxWidth = (isDesktop || isDesktopXL)
      ? Math.floor(inputWrapperMaxWidth * 0.9)
      : isTablet
      ? (isDesktop ? 1040 : 860)
      : Math.min(width - 48, 500);
    return { isTablet, isDesktop, isDesktopXL, headerMaxWidth };
  }, []);
}


