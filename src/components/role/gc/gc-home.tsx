"use client"

import { useState } from "react"
import Image from "next/image"

export default function ProjectDashboard() {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  return (
      <div className="max-w-full mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Project Assignments */}
          <div className="bg-[#151E2F80] rounded-lg p-6 border border-card-bg">
            <div className="text-sm text-gray-400 mb-2">Active Project Assignments</div>
            <div className="text-4xl font-bold text-white">2</div>
          </div>

          {/* Pending Milestone Approvals */}
          <div className="bg-[#151E2F80] rounded-lg p-6 border border-card-bg">
            <div className="text-sm text-gray-400 mb-2">Pending Milestone Approvals</div>
            <div className="text-4xl font-bold text-yellow-500">1</div>
          </div>

          {/* Pending Payments */}
          <div className="bg-[#151E2F80] rounded-lg p-6 border border-card-bg">
            <div className="text-sm text-gray-400 mb-2">Pending Payments</div>
            <div className="text-4xl font-bold text-blue-400">£45,800</div>
            <button className="text-sm text-blue-400 hover:text-blue-300 mt-2 transition-colors">View Documents</button>
          </div>
        </div>

        {/* Project Cards */}
        <div className="space-y-4">
          {/* Exeter Community Wind Turbine Farm */}
          <div className="bg-[#151b2e] rounded-lg overflow-hidden border border-[#30363D]">
            <button
              onClick={() => toggleProject("exeter")}
              className="w-full relative h-32 flex items-center justify-center group"
            >
              {/* <Image
                src="/wind-turbines-sunset.png"
                alt="Wind turbines"
                fill
                className="object-cover opacity-40 group-hover:opacity-50 transition-opacity"
              /> */}
              <div className="relative z-10 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Exeter Community Wind Turbine Farm</h2>
                <svg
                  className={`w-6 h-6 mx-auto transition-transform ${
                    expandedProjects.includes("exeter") ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expandedProjects.includes("exeter") && (
              <div className="p-6 border-t border-gray-800">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Current Task */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Current Task</h3>
                    <div className="space-y-4">
                      {/* Task 1 - Complete */}
                      <div className="bg-[#1a2237] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-white font-mono text-sm">Finalize site grading</span>
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                            COMPLETE
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Due: Oct 20</span>
                          <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                            Update Status
                          </button>
                        </div>
                      </div>

                      {/* Task 2 - In Progress */}
                      <div className="bg-[#1a2237] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-white font-mono text-sm">Pour foundation pads (Sector A)</span>
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                            IN PROGRESS
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Due: Oct 25</span>
                          <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                            Update Status
                          </button>
                        </div>
                      </div>

                      {/* Task 3 - Not Started */}
                      <div className="bg-[#1a2237] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-white font-mono text-sm">Install perimeter fencing</span>
                          <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full border border-gray-500/20">
                            NOT STARTED
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "10%" }}></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Due: Oct 30</span>
                          <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                            Update Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Next Milestone & AI Twin */}
                  <div className="space-y-4">
                    {/* Next Milestone */}
                    <div className="bg-[#1a2237] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-white font-semibold">Next Milestone</span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                          AWAITING AUDITOR VERIFICATION
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="text-white">
                          Milestone 3: <span className="font-semibold">Foundations Complete</span>
                        </div>
                        <div className="text-gray-400 text-sm">Estimate Done: Oct 28</div>
                        <div className="text-white">
                          Payment: <span className="text-emerald-400 font-semibold">£45,000</span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors text-sm border border-emerald-500/20">
                        Submit Verification Docs
                      </button>
                    </div>

                    {/* AI Digital Twin */}
                    <div className="bg-[#1a2237] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                        <span className="text-white font-semibold">View AI-Digital Twin</span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Efficiency Score:</span>
                          <span className="text-emerald-400 font-semibold">A-</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Safety Incidents (7d):</span>
                          <span className="text-emerald-400 font-semibold">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Material Waste Est:</span>
                          <span className="text-white font-semibold">2.1%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Weather Forecast (24h):</span>
                          <span className="text-white font-semibold">Clear, 15°C</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scottish Highlands Hydro Revamp */}
          <div className="bg-[#151b2e] rounded-lg overflow-hidden border border-[#30363D]">
            <button
              onClick={() => toggleProject("scottish")}
              className="w-full relative h-32 flex items-center justify-center group"
            > 
              {/* <Image
                src="/scottish-highlands-water-landscape.jpg"
                alt="Scottish Highlands"
                fill
                className="object-cover opacity-40 group-hover:opacity-50 transition-opacity"
              /> */}
              <div className="relative z-10 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Scottish Highlands Hydro Revamp</h2>
                <svg
                  className={`w-6 h-6 mx-auto transition-transform ${
                    expandedProjects.includes("scottish") ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expandedProjects.includes("scottish") && (
              <div className="p-6 border-t border-gray-800">
                <p className="text-gray-400">Project details will appear here...</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports Due */}
          <div className="bg-[#151E2F80] rounded-lg p-6 border border-[#30363D]">
            <h3 className="text-xl font-bold text-white mb-4">Reports Due</h3>
            <div className="bg-[#1a2237] rounded-lg p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="text-white font-mono text-sm mb-2">Weekly Progress & Safety Report</div>
                <div className="text-red-400 text-sm">Due: Oct 24, 2025</div>
              </div>
              <button className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Submit
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-[#151E2F80] rounded-lg p-6 border border-[#30363D]">
            <h3 className="text-xl font-bold text-white mb-4">Messages</h3>
            <button className="w-full bg-[#1a2237] rounded-lg p-4 flex items-center justify-between hover:bg-[#1f2844] transition-colors group">
              <div className="text-left flex-1">
                <div className="text-white text-sm mb-1">Query on Milestone 2 Documentation</div>
                <div className="text-gray-500 text-xs">From: Auditor Team • Oct 22, 2025</div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
  )
}
