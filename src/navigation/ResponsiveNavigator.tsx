import React from 'react';
import { MobileNavigator } from './MobileNavigator';
import { DesktopDrawerNavigator } from './DesktopDrawerNavigator';
import { useResponsive } from '../hooks/useResponsive';

export const ResponsiveNavigator: React.FC = () => {
  const { isDesktop } = useResponsive();

  if (isDesktop) {
    return <DesktopDrawerNavigator />;
  }

  return <MobileNavigator />;
};
