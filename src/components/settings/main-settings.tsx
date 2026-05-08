'use client';

import { useState, type ReactNode } from 'react';
import { TabSelect } from '@/components/ui/tab-select';
import { ProfileDetail } from './profile-detail/profile-detail';

interface TabItem {
  name: string;
  component: ReactNode;
}

export function MainSettings() {
  const tabItems: TabItem[] = [
    {
      name: 'Profile Details',
      component: <ProfileDetail />,
    },
    {
      name: 'Verification',
      component: (
        <div className="py-6 text-gray-300">Verification (coming soon)</div>
      ),
    },
    {
      name: 'Security',
      component: (
        <div className="py-6 text-gray-300">Security (coming soon)</div>
      ),
    },
    {
      name: 'Notifications',
      component: (
        <div className="py-6 text-gray-300">Notifications (coming soon)</div>
      ),
    },
  ];

  const [selectedTab, setSelectedTab] = useState<string>(tabItems[0].name);
  const activeComponent = tabItems.find(
    (item) => item.name === selectedTab
  )?.component;
  const tabNames = tabItems.map((item) => item.name);

  return (
    <div className="w-full h-fit flex flex-col gap-6">
      <TabSelect
        items={tabNames}
        selectedItem={selectedTab}
        onSelect={setSelectedTab}
      />
      <div className="mt-2">{activeComponent}</div>
    </div>
  );
}
