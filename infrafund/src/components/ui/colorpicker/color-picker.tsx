"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ColorWheel } from "./color-wheel"
import { FormInput } from "../form-input"

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ label, value, onChange, className = "" }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(value)
  const [activeTab, setActiveTab] = useState<"wheel" | "palette">("wheel")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Predefined color palette
  const colors = [
    "#E1E7FF",
    "#B9927B",
    "#E6EBFC",
    "#FFFFFF",
    "#000000",
    "#868795",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#F4D03F",
    "#A569BD",
    "#5DADE2",
    "#58D68D",
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !isDragging) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDragging])

  const handleColorHover = (color: string) => {
    setSelectedColor(color)
  }

  const handleColorClick = (color: string) => {
    setSelectedColor(color)
    onChange(color)
    setIsOpen(false)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hexValue = e.target.value
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
      setSelectedColor(hexValue)
      onChange(hexValue)
    } else if (hexValue.startsWith("#") && hexValue.length <= 7) {
      // Allow partial typing
      setSelectedColor(hexValue)
    }
  }

  const handleColorWheelChange = (color: string) => {
    setSelectedColor(color)
    onChange(color)
  }

  return (
    <div className={`${className} relative`} ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border border-gray-600 cursor-pointer"
            style={{ backgroundColor: selectedColor }}
            onClick={() => setIsOpen(!isOpen)}
          />
          <div className="flex-1 w-[229px]">
            <div className="text-white text-sm font-medium mb-2">{label}</div>
            <FormInput
              label=""
              placeholder="#000000"
              type="text"
              value={selectedColor}
              onChange={handleHexInputChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 p-4 bg-card-bg rounded-lg z-50 min-w-max"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <div className="flex space-x-2 mb-4 border-b border-gray-700">
            <button
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "wheel"
                  ? "text-white bg-card-bg border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("wheel")}
            >
              Color Wheel
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "palette"
                  ? "text-white bg-card-bg border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("palette")}
            >
              Palette
            </button>
          </div>

          {activeTab === "wheel" ? (
            <div className="flex justify-center">
              <ColorWheel value={selectedColor} onChange={handleColorWheelChange} size={240} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {colors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform cursor-pointer hover:border-white"
                    style={{ backgroundColor: color }}
                    onMouseEnter={() => handleColorHover(color)}
                    onClick={() => handleColorClick(color)}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <label className="block text-white text-sm font-medium mb-2">Custom Color</label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorClick(e.target.value)}
                  className="w-full h-10 rounded border border-gray-600 bg-transparent cursor-pointer"
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
