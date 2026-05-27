'use client';
import { CustomButton } from '@/components/ui/custom-button';
import { TabSelect } from '@/components/ui/tab-select';
import { Eye, Play } from 'lucide-react';
import React, { useState } from 'react';
import Sections from './create-sections/sections';
import Team from './create-sections/team';
import Colors from './create-sections/colors';
import Contact from './create-sections/contact';
import Reports from './create-sections/reports';
import Seo from './create-sections/seo';
import Transfer from './create-sections/transfer';
import Faq from './create-sections/faq';
import Highlights from './create-sections/highlights';
import CardView from '@/components/ui/card-view';
import PressSection from './create-sections/press-section';
import Technologies from './create-sections/technology';
import MediaSection from './create-sections/media-section';

export default function MainCreate() {
  const createsection = [
    { title: 'Media', component: MediaSection },
    { title: 'Sections', component: Sections },
    { title: 'Team', component: Team },
    { title: 'Colors', component: Colors },
    { title: 'Contact', component: Contact },
    { title: 'Reports', component: Reports },
    { title: 'Seo', component: Seo },
    { title: 'Transfer', component: Transfer },
    { title: 'FAQs', component: Faq },
    { title: 'Highlights', component: Highlights },
    { title: 'Press Section', component: PressSection },
    { title: 'Technology', component: Technologies },
  ];

  const [selected, setSelected] = useState('Media');

  const activeSection = createsection.find(
    (section) => section.title === selected
  );

  return (
    <div className="flex flex-col items-center gap-16">
      {/* Top buttons */}
      <div className="flex w-full items-center justify-end gap-6">
        <CustomButton
          variant="canceled"
          className="flex items-center gap-2 text-primary w-[142px] h-[48px]"
        >
          <Eye size={20} />
          <span className="text-lg font-semibold">Preview</span>
        </CustomButton>
        <CustomButton
          variant="filled"
          className="flex items-center gap-2 text-black w-[142px] h-[48px]"
        >
          <span className="text-lg font-semibold">Publish</span>
          <Play size={20} />
        </CustomButton>
      </div>

      {/* Tabs + Content */}
      <div className="flex w-full flex-col items-center justify-center gap-8">
        <div className="flex justify-start items-center w-full">
          <TabSelect
            items={createsection.map((s) => s.title)}
            selectedItem={selected}
            onSelect={setSelected}
          />
        </div>
        <CardView padding="p-12 border border-[#2B313A]">
          {activeSection ? <activeSection.component /> : 'No section found'}
        </CardView>
      </div>
    </div>
  );
}
