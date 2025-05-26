import * as React from 'react';

export type TabItem = {
  label: string;
  value: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};
