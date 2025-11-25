"use client";
import { ColorPicker } from "@/components/ui/colorpicker/color-picker";
import React, { useState } from "react";

export default function Colors() {
  const [colors, setColors] = useState({
    backgroundColor: "#E1E7FF",
    primaryMainColor: "#B9927B",
    informationBonesColor: "#E6EBFC",
    buttonTextColor: "#FFFFFF",
    textPrimaryColor: "#000000",
    textSecondaryColor: "#868795",
    iconColor: "#FFFFFF",
  });

  const handleColorChange = (key: string, color: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: color,
    }));
  };

  return (
    <div className="w-full h-fit">
      <h1 className="text-3xl font-bold text-white mb-8">
        Color Picker UI Kit
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4  border border-[#424242] rounded-[20px] p-4">
        <ColorPicker
          label="Background Color"
          value={colors.backgroundColor}
          onChange={(color) => handleColorChange("backgroundColor", color)}
        />

        <ColorPicker
          label="Primary Main Color"
          value={colors.primaryMainColor}
          onChange={(color) => handleColorChange("primaryMainColor", color)}
        />

        <ColorPicker
          label="Color Of Information Bones"
          value={colors.informationBonesColor}
          onChange={(color) =>
            handleColorChange("informationBonesColor", color)
          }
        />

        <ColorPicker
          label="Button Text Color"
          value={colors.buttonTextColor}
          onChange={(color) => handleColorChange("buttonTextColor", color)}
        />

        <ColorPicker
          label="Text Primary Color"
          value={colors.textPrimaryColor}
          onChange={(color) => handleColorChange("textPrimaryColor", color)}
        />

        <ColorPicker
          label="Text Secondary Color"
          value={colors.textSecondaryColor}
          onChange={(color) => handleColorChange("textSecondaryColor", color)}
        />

        <ColorPicker
          label="Color Of Icon"
          value={colors.iconColor}
          onChange={(color) => handleColorChange("iconColor", color)}
          className="md:col-span-2"
        />
      </div>
    </div>
  );
}
