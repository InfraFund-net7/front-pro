'use client';

import React, { useState } from 'react';
import { TabSelect } from '../ui/tab-select';
import ProfileDetail from './profile-detail.tsx/profile-detail';

interface TabItem {
    name: string;
    component: React.ReactNode;
}

export default function MainSetting() {
    const tabItems: TabItem[] = [
        {
            name: "Profile Details",
            component: <ProfileDetail />,
        },
        {
            name: "Verification",
            component: <div className="py-6">Verification Content</div>,
        },
        {
            name: "Security",
            component: <div className="py-6">Security Content</div>,
        },
        {
            name: "Notifications",
            component: <div className="py-6">Notifications Content</div>,
        },
    ];

    const [selectedTab, setSelectedTab] = useState<string>(tabItems[0].name);

    const activeComponent = tabItems.find((item) => item.name === selectedTab)?.component;
    const tabNames = tabItems.map((item) => item.name);

    return (
        <div className="w-full h-fit flex flex-col gap-6">
            <TabSelect
                items={tabNames}
                selectedItem={selectedTab}
                onSelect={setSelectedTab}
            />
            <div className="mt-2">
                {activeComponent}
            </div>
        </div>
    );
}