import { FormInput } from "@/components/ui/form-input";
import React from "react";

export default function Seo() {
  return (
    <div className="flex flex-col gap-12 w-full">
      <span className="text-3xl text-white font-normal">Seo Settings</span>
      <FormInput label="Important Keywords" placeholder="Important Keywords" className="w-full" />
    </div>
  );
}
