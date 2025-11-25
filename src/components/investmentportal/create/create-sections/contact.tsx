import React from "react";
import { Slack, Mail } from "lucide-react";
import discord from "@/../public/assets/svg/Discord.svg";
import facebook from "@/../public/assets/svg/facebook.svg";
import Telegram from "@/../public/assets/svg/Telegram.svg";
import X from "@/../public/assets/svg/X.svg";
import instagram from "@/../public/assets/svg/instagram.svg";
import linkedin from "@/../public/assets/svg/linkedin.svg";
import { FormInput } from "@/components/ui/form-input";
import Image from "next/image";

export default function Contact() {
  const socials = [
    { icon: discord, title: "Discord", link: "", type: "image" },
    { icon: Telegram, title: "Telegram", link: "", type: "image" },
    { icon: X, title: "X(Twitter)", link: "", type: "image" },
    { icon: instagram, title: "Instagram", link: "", type: "image" },
    { icon: facebook, title: "Facebook", link: "", type: "image" },
    { icon: Slack, title: "Slack", link: "", type: "component" },
    { icon: linkedin, title: "Linkedin", link: "", type: "image" },
    { icon: Mail, title: "Email", link: "", type: "component" },
  ];

  return (
    <div className="flex flex-col  w-full gap-20">
      <div className="w-full h-fit  flex flex-col gap-6">
        <span className="text-3xl text-white font-normal">
          Community Channels
        </span>
        <div className="w-full h-fit border border-[#424242] rounded-[20px] p-6 flex flex-col gap-6">
          <span className="text-base font-normal text-[#C7CAD5]">
            **maximum of 4 icons will be displayed at one time.
          </span>
          <div className="grid grid-cols-3 justify-between items-center w-full gap-6">
            {socials.map((item, index) => (
              <div className="flex flex-col gap-2" key={index}>
                <div className="flex gap-2 justify-start items-center">
                  {item.type === "image" ? (
                    <Image
                      src={item.icon}
                      width={24}
                      height={24}
                      alt={item.title}
                    />
                  ) : (
                    <item.icon size={24} className="text-white" />
                  )}
                  <span className="text-sm text-white font-medium">
                    {item.title}
                  </span>
                </div>
                <FormInput placeholder={item.title} className="w-[251px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <span className="text-2xl font-normal text-white">
          Contact Information
        </span>
        <div className="w-full h-fit border border-[#424242] flex justify-between items-center p-6 rounded-[20px]">
          <FormInput placeholder="Email" className="w-[251px]" />
          <FormInput placeholder="Phone number" className="w-[251px]" />
          <FormInput placeholder="Address" className="w-[251px]" />
        </div>
      </div>
    </div>
  );
}
