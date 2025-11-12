"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock } from "@/icons"
import * as Icons from "@/icons"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface NavItem {
  title: string
  url: string
  icon: string
  disabled?: boolean
  children?: NavItem[]
}

interface NavigationProps {
  items: NavItem[]
}

export default function Navigation({ items }: NavigationProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  return (
    <nav className="space-y-2">
      {items.map((item, i) => {
        const Icon = Icons[item.icon as keyof typeof Icons]
        const isActive = pathname === item.url
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = expandedItems.includes(item.title)

        return (
          <div key={i} className="relative chakra-petch">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(item.title)}
                className={`
                  w-full h-12 px-4 rounded-lg flex items-center gap-3 group transition-all duration-200
                  ${item.disabled
                    ? "text-gray-600 cursor-not-allowed opacity-60"
                    : isActive
                      ? "bg-card-selected-bg text-primary"
                      : "text-gray-400 hover:text-gray-200 hover:bg-slate-800/50"
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.title}</span>
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
                {item.disabled && <Lock className="w-5 h-5 text-yellow-500" />}
              </button>
            ) : (
              <Link
                href={item.disabled ? "#" : item.url}
                className={`
                  w-full h-12 px-4 rounded-lg flex items-center gap-3 group transition-all duration-200
                  ${item.disabled
                    ? "text-gray-600 cursor-not-allowed opacity-60"
                    : isActive
                      ? "bg-card-selected-bg text-primary"
                      : "text-gray-400 hover:text-gray-200 hover:bg-slate-800/50"
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.title}</span>

                {item.disabled && <Lock className="w-5 h-5 text-yellow-500 ml-auto" />}
              </Link>
            )}

            {hasChildren && isExpanded && (
              <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-700/50 pl-4">
                {item.children!.map((child, childIndex) => {
                  const ChildIcon = Icons[child.icon as keyof typeof Icons]
                  const isChildActive = pathname === child.url

                  return (
                    <Link
                      key={childIndex}
                      href={child.disabled ? "#" : child.url}
                      className={`
                        w-full h-10 px-3 rounded-lg flex items-center gap-3 group transition-all duration-200
                        ${child.disabled
                          ? "text-gray-600 cursor-not-allowed opacity-60"
                          : isChildActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-gray-400 hover:text-gray-200 hover:bg-slate-800/50"
                        }
                      `}
                    >
                      <ChildIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{child.title}</span>
                      {child.disabled && <Lock className="w-4 h-4 text-yellow-500 ml-auto" />}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
