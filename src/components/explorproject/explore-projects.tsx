import React from 'react';
import CardView from '../ui/card-view';
import Image from 'next/image';
import ProjectImage from '@public/assets/image/explore-data.jpg';
import CurrencyProgressBar from '../ui/currency-progress-bar';
import { CustomButton } from '../ui/custom-button';

export default function ExploreProjects() {
  const projects = [
    {
      image: ProjectImage,
      title: 'GeoThermal Energy',
      RoundName: 'Public',
      Participants: 100,
      ProjectStart: 'TBA',
      CampaignEndsIn: '30D',
      RaisedAmount: 30000,
      totalAmount: 3000000,
    },
    {
      image: ProjectImage,
      title: 'Solar Panel',
      RoundName: 'Public',
      Participants: 200,
      ProjectStart: 'TBA',
      CampaignEndsIn: '50D',
      RaisedAmount: 1000000,
      totalAmount: 2000000,
    },
    {
      image: ProjectImage,
      title: 'Wave Power',
      RoundName: 'Public',
      Participants: 100,
      ProjectStart: 'TBA',
      CampaignEndsIn: '30D',
      RaisedAmount: 30000,
      totalAmount: 1000000,
    },
    {
      image: ProjectImage,
      title: 'GeoThermal Energy',
      RoundName: 'Public',
      Participants: 100,
      ProjectStart: 'TBA',
      CampaignEndsIn: '30D',
      RaisedAmount: 70000,
      totalAmount: 300000,
    },
    {
      image: ProjectImage,
      title: 'Solar Panel',
      RoundName: 'Public',
      Participants: 200,
      ProjectStart: 'TBA',
      CampaignEndsIn: '50D',
      RaisedAmount: 1000000,
      totalAmount: 2000000,
    },
    {
      image: ProjectImage,
      title: 'Wave Power',
      RoundName: 'Public',
      Participants: 100,
      ProjectStart: 'TBA',
      CampaignEndsIn: '30D',
      RaisedAmount: 1000000,
      totalAmount: 1050000,
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-hidden px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((item, index) => (
          <CardView
            width="340"
            height="577"
            className="rounded-[32px] relative"
            key={index}
          >
            <Image
              src={item.image}
              width={340}
              height={182}
              alt=""
              className="rounded-t-[32px] absolute top-0 left-0"
            />
            <div className="w-[340px] h-[150px]" />
            <div className="w-full h-fit flex justify-center items-center mb-[24px] ">
              <div className="flex flex-col gap-7 w-[292px]">
                <span className="text-[22px] font-bold text-gray-50 mt-4 block">
                  {item.title}
                </span>

                <div className="flex flex-col gap-4 w-[292px] ">
                  {[
                    { label: 'Round Name', value: item.RoundName },
                    { label: 'Participants', value: item.Participants },
                    { label: 'Project Start', value: item.ProjectStart },
                    { label: 'Campaign Ends In', value: item.CampaignEndsIn },
                  ].map((field, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-medium text-gray-50">
                        {field.label}:
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 justify-center items-start w-full">
                  <span className="text-sm text-gray-400 font-medium">
                    Raised Amount
                  </span>
                  <CurrencyProgressBar
                    currentAmount={item.RaisedAmount}
                    totalAmount={item.totalAmount}
                    currency="USDC"
                  />
                </div>
              </div>
            </div>
            <CustomButton variant="filled" className="w-full">
              Visit Page
            </CustomButton>
          </CardView>
        ))}
      </div>
    </div>
  );
}
