'use client';

import solar from '@/../public/assets/image/solar-default-1024w.webp';
import solarProject2 from '@/../public/assets/image/solar-project-2-1024w.webp';
import wind from '@/../public/assets/image/wind-default-2000w.webp';
import windProject2 from '@/../public/assets/image/wind-project-2-1024w.webp';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { listMyProjects } from '@/lib/backend-auth-client';
import {
  DEMO_DIGITAL_TWIN_PROJECT_ID,
  isDigitalTwinDemoModeEnabled,
} from '@/lib/digital-twin-demo';

// The cards below are static mock content (stats, copy, images); only the
// "AI Digital Twin" links are wired to real project IDs here, since the
// digital-twin viewer is now DB-backed and needs an actual project id.
// See isDigitalTwinDemoModeEnabled() for the demo-mode fallback.
export default function DeveloperHome() {
  const { backendAccessToken, refreshSession } = useAuthSession();
  const [digitalTwinProjectIds, setDigitalTwinProjectIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      let accessToken = backendAccessToken;

      if (!accessToken) {
        accessToken = await refreshSession();
      }

      if (!accessToken) {
        return;
      }

      try {
        const { items } = await listMyProjects(accessToken);

        if (isMounted) {
          setDigitalTwinProjectIds(items.map((project) => project.id));
        }
      } catch {
        // Dashboard stats above stay as mock data regardless; the digital
        // twin links below simply stay unavailable if this fails.
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [backendAccessToken, refreshSession]);

  // Off by default; when explicitly turned on (NEXT_PUBLIC_DIGITAL_TWIN_DEMO_MODE),
  // any slot without a real owned project falls back to a fixed, always-seeded
  // demo project instead of rendering as a disabled, non-clickable link.
  const demoModeEnabled = isDigitalTwinDemoModeEnabled();
  const [firstRealProjectId, secondRealProjectId, thirdRealProjectId] =
    digitalTwinProjectIds;
  const demoFallback = demoModeEnabled
    ? DEMO_DIGITAL_TWIN_PROJECT_ID
    : undefined;
  const firstProjectId = firstRealProjectId ?? demoFallback;
  const secondProjectId = secondRealProjectId ?? demoFallback;
  const thirdProjectId = thirdRealProjectId ?? demoFallback;

  return (
    <div className="min-h-screen flex flex-col gap-12 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card-bg rounded-lg p-6 text-center">
          <h3 className="text-gray-400 text-sm mb-2">Active Projects</h3>
          <p className="text-2xl font-bold">3</p>
        </div>

        <div className="bg-card-bg rounded-lg p-6 text-center">
          <h3 className="text-gray-400 text-sm mb-2">Total Funding Raised</h3>
          <p className="text-2xl font-bold">£9,500,000</p>
          <p className="text-green-500 text-sm mt-2">88.5% of Target</p>
        </div>

        <div className="bg-card-bg rounded-lg p-6 text-center">
          <h3 className="text-gray-400 text-sm mb-2">Total Investors</h3>
          <p className="text-2xl font-bold">185</p>
        </div>

        <div className="bg-card-bg rounded-lg p-6 text-center">
          <h3 className="text-gray-400 text-sm mb-2">Compliance Status</h3>
          <p className="text-2xl font-bold text-green-500">Verified</p>
          <a
            href="#"
            className="text-blue-500 text-sm mt-2 inline-block hover:underline"
          >
            View Documents
          </a>
        </div>
      </div>

      <div className="border border-[#30363D] p-6 bg-card-bg rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Projects Dashboard</h2>
          <button className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded-lg flex items-center gap-2">
            Create New Project
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1F2937] border border-[#374151] rounded-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-48 h-64 flex-shrink-0">
                <Image
                  src={wind}
                  alt="Cornwall Wind turbine Pilot #1"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Cornwall Wind turbine Pilot #1
                    </h3>
                    <span className="inline-block bg-lime-600 text-lime-100 text-xs font-bold px-3 py-1 rounded-full">
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-bold">
                        AI Risk Score: Low
                      </span>
                    </div>

                    {firstProjectId ? (
                      <Link
                        href={`/projects/${firstProjectId}/digital-twin`}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">AI Digital Twin ↗</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">AI Digital Twin ↗</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Return Rate:{' '}
                    <span className="text-white font-bold">12%</span> |
                    Investors: <span className="text-white">78</span>
                    <br />
                    Maintenance: <span className="text-white">02-03-2028</span>
                  </p>

                  <div className="mb-2">
                    <p className="text-gray-400 text-sm mb-1">
                      Return Progress: 67%
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: '67%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Page Views: 30,000</span>
                    </div>
                    <span>Conversion Rate: 0%</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Edit Project</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Manage Investor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1F2937] border border-[#374151] rounded-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-48 h-64 flex-shrink-0">
                <Image
                  src={windProject2}
                  alt="Cornwall Wind turbine Pilot #2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Cornwall Wind turbine Pilot #2
                    </h3>
                    <span className="inline-block bg-blue-600 text-blue-100 text-xs font-bold px-3 py-1 rounded-full">
                      Construction
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-bold">
                        AI Risk Score: Low
                      </span>
                    </div>

                    {secondProjectId ? (
                      <Link
                        href={`/projects/${secondProjectId}/digital-twin`}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">AI Digital Twin ↗</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">AI Digital Twin ↗</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Project Status:{' '}
                    <span className="text-white font-bold">Active</span> |
                    General Contractor:{' '}
                    <span className="text-white">Wind Power Ltd</span>
                    <br />
                    Next Milestone:{' '}
                    <span className="text-white">
                      Rotor Blades Installation
                    </span>
                  </p>

                  <div className="mb-2">
                    <p className="text-gray-400 text-sm mb-1">
                      Construction Progress: 67%
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-lime-500 h-2 rounded-full"
                        style={{ width: '67%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Page Views: 12,500</span>
                    </div>
                    <span>Conversion Rate: 0%</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Edit Project</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Manage Investor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1F2937] border border-[#374151] rounded-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-48 h-64 flex-shrink-0">
                <Image
                  src={windProject2}
                  alt="London Wind turbine Pilot #3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      London Wind turbine Pilot #3
                    </h3>
                    <span className="inline-block bg-lime-600 text-lime-100 text-xs font-bold px-3 py-1 rounded-full">
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-bold">
                        AI Risk Score: Low
                      </span>
                    </div>

                    {thirdProjectId ? (
                      <Link
                        href={`/projects/${thirdProjectId}/digital-twin`}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">AI Digital Twin ↗</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">AI Digital Twin ↗</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Return Rate:{' '}
                    <span className="text-white font-bold">12%</span> |
                    Investors: <span className="text-white">78</span>
                    <br />
                    Maintenance: <span className="text-white">02-03-2028</span>
                  </p>

                  <div className="mb-2">
                    <p className="text-gray-400 text-sm mb-1">
                      Return Progress: 67%
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: '67%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Page Views: 12,500</span>
                    </div>
                    <span>Conversion Rate: 0%</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Edit Project</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Manage Investor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1F2937] border border-[#374151] rounded-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-48 h-64 flex-shrink-0">
                <Image
                  src={solarProject2}
                  alt="Cornwall Solar Farm"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Cornwall Solar Farm
                    </h3>
                    <span className="inline-block bg-fuchsia-600 text-fuchsia-100 text-xs font-bold px-3 py-1 rounded-full">
                      VOTING
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-bold">
                        AI Risk Score: Low
                      </span>
                    </div>

                    <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                      </svg>
                      <span className="text-sm">AI Digital Twin ↗</span>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Vote Amount:{' '}
                    <span className="text-white font-bold">3100/6000</span> |
                    Next Step:{' '}
                    <span className="text-white">Waiting for result</span>
                  </p>

                  <div className="mb-2">
                    <p className="text-gray-400 text-sm mb-1">
                      Voting Progress 51%
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-fuchsia-500 h-2 rounded-full"
                        style={{ width: '51%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Page Views: 5,000</span>
                    </div>
                    <span>Conversion Rate: 62%</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Edit Project</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Manage Investor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1F2937] border border-[#374151] rounded-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-48 h-64 flex-shrink-0">
                <Image
                  src={solar}
                  alt="Exeter Community Solar Farm"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Exeter Community Solar Farm
                    </h3>
                    <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">
                      FUNDING
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-bold">
                        AI Risk Score: Medium
                      </span>
                    </div>

                    <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                      </svg>
                      <span className="text-sm">AI Digital Twin ↗</span>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Raised Amount:{' '}
                    <span className="text-white font-bold">£350k / £500k</span>{' '}
                    | Investors: <span className="text-white">78</span> |
                    Closing Date: <span className="text-white">23-10-2027</span>
                  </p>

                  <div className="mb-2">
                    <p className="text-gray-400 text-sm mb-1">
                      Funding Progress: 70%
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: '70%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Page Views: 75,000</span>
                    </div>
                    <span>Conversion Rate: 6.2%</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Edit Project</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Manage Investor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
