import solar from '@/../public/assets/image/solar-default-1024w.webp';
import solarProject2 from '@/../public/assets/image/solar-project-2-1024w.webp';
import wind from '@/../public/assets/image/wind-default-2000w.webp';
import windProject2 from '@/../public/assets/image/wind-project-2-1024w.webp';
import Image from 'next/image';
import Link from 'next/link';

export default function DeveloperHome() {
  return (
    <div className="min-h-screen flex flex-col gap-12 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card-bg rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-2">Active Projects</h3>
          <p className="text-4xl font-bold">3</p>
        </div>

        <div className="bg-card-bg rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-2">Total Funding Raised</h3>
          <p className="text-4xl font-bold">£1,120.30</p>
          <p className="text-green-500 text-sm mt-2">88.5% of Target</p>
        </div>

        <div className="bg-card-bg rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-2">Total Investors</h3>
          <p className="text-4xl font-bold">185</p>
        </div>

        <div className="bg-card-bg rounded-lg p-6">
          <h3 className="text-gray-400 text-sm mb-2">Compliance Status</h3>
          <p className="text-4xl font-bold text-green-500">Verified</p>
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
                    <span className="inline-block bg-blue-600 text-blue-100 text-xs font-bold px-3 py-1 rounded-full">
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

                    <Link
                      href="/projects/1/digital-twin"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                      </svg>
                      <span className="text-sm">View AI-Digital Twin</span>
                    </Link>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Return Rate:{' '}
                    <span className="text-white font-bold">12%</span> |
                    Investors: <span className="text-white">78</span> | Next
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
                    <span className="inline-block bg-lime-600 text-lime-100 text-xs font-bold px-3 py-1 rounded-full">
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

                    <Link
                      href="/projects/2/digital-twin"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                      </svg>
                      <span className="text-sm">View AI-Digital Twin</span>
                    </Link>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Project Status:{' '}
                    <span className="text-white font-bold">Active</span> |
                    General Contractor:{' '}
                    <span className="text-white">Solardeveloper.co</span> | Next
                    Milestone:{' '}
                    <span className="text-white">Panel Installation</span>
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
                  alt="Cornwall Wind turbine Pilot #3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Cornwall Wind turbine Pilot #3
                    </h3>
                    <span className="inline-block bg-lime-600 text-lime-100 text-xs font-bold px-3 py-1 rounded-full">
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

                    <Link
                      href="/projects/3/digital-twin"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                      </svg>
                      <span className="text-sm">View AI-Digital Twin</span>
                    </Link>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Project Status:{' '}
                    <span className="text-white font-bold">Active</span> |
                    General Contractor:{' '}
                    <span className="text-white">Solardeveloper.co</span> | Next
                    Milestone:{' '}
                    <span className="text-white">Panel Installation</span>
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
                      <span className="text-sm">View AI-Digital Twin</span>
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
                    <span className="inline-block bg-green-600 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
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
                      <span className="text-sm">View AI-Digital Twin</span>
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

      <div className="border border-[#30363D] p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-6">
          Critical Alerts & Notifications
        </h2>

        <div className="space-y-4">
          <div className="border border-[#E5E7EB] rounded-lg p-6 relative">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-yellow-500 rounded-full p-2 flex-shrink-0">
                <svg
                  className="w-6 h-6 text-gray-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">AI-Twin Alert</h3>
                <p className="text-gray-300 mb-3">
                  Cornwall Geothermal: Predictive analysis indicates potential
                  3-day delay on Milestone 4 due to sensor data anomalies from
                  Drilling Rig B. Recommended action: Schedule maintenance
                  check.
                </p>
                <p className="text-gray-500 text-sm">Oct 23, 2025 09:15 GMT</p>
              </div>
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-lg p-6 relative">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Funding Alert</h3>
                <p className="text-gray-300 mb-3">
                  Exeter Solar: Funding deadline approaching (7 days).
                  Engagement metrics are strong.
                </p>
                <p className="text-gray-500 text-sm">Oct 22, 2025 11:00 GMT</p>
              </div>
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-lg p-6 relative">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Compliance</h3>
                <p className="text-gray-300 mb-3">
                  Q4 Regulatory Report due for Cornwall Geothermal (Submit by
                  Nov 15).
                </p>
                <p className="text-gray-500 text-sm">Oct 20, 2025 15:30 GMT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
