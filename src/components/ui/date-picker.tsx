"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = "Select date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const containerRef = useRef<HTMLDivElement>(null)

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const formattedDate = date.toLocaleDateString("en-GB")
    onChange(formattedDate)
    setIsOpen(false)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => navigateMonth("prev")} className="p-1 hover:bg-slate-700 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="text-white font-medium">
              {months[currentMonth]} {currentYear}
            </div>
            <button type="button" onClick={() => navigateMonth("next")} className="p-1 hover:bg-slate-700 rounded">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-center text-xs text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="h-8"></div>
            ))}
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDateSelect(day)}
                className="h-8 text-sm text-white hover:bg-blue-600 rounded flex items-center justify-center transition-colors"
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
