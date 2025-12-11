"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const chartData = [
  { name: "INFO", value: 30, color: "#3b82f6" },
  { name: "TRK", value: 20, color: "#10b981" },
  { name: "USDT", value: 20, color: "#f59e0b" },
  { name: "BTC", value: 15, color: "#8b5cf6" },
  { name: "GBP", value: 15, color: "#ec4899" },
]

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1f2e] border border-[#252a3a] rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-gray-400 text-sm">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export default function InvestorHome() {
  return (
      <div className="w-full mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400">📊</span>
              </div>
              <span className="text-gray-400 text-sm">Portfolio Value</span>
            </div>
            <div className="text-2xl font-bold">£12,580.50</div>
          </div>

          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400">📈</span>
              </div>
              <span className="text-gray-400 text-sm">Total Return</span>
            </div>
            <div className="text-2xl font-bold">£1,120.30</div>
            <div className="text-green-400 text-xs mt-1">+8.1% YTD</div>
          </div>

          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400">🎯</span>
              </div>
              <span className="text-gray-400 text-sm">Projected IRR</span>
            </div>
            <div className="text-2xl font-bold">11.5%</div>
          </div>

          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400">💰</span>
              </div>
              <span className="text-gray-400 text-sm">Available Cash</span>
            </div>
            <div className="text-2xl font-bold">£560.20</div>
            <button className="text-blue-400 text-xs mt-1 hover:underline">Withdraw</button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Investments */}
          <div className="lg:col-span-2 bg-[#151E2F80] border border-card-bg rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">My Investments</h2>
            <div className="space-y-3">
              {/* Investment Card 1 */}
              <div className="bg-[#1a1f2e] border border-[#252a3a] rounded-lg p-4 flex gap-4">
                <div className="w-16 h-16 bg-orange-500/20 rounded-lg flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">Exeter Community Solar Farm</h3>
                      <span className="text-xs text-gray-400">(Equity)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-400">🔧 At-Risk</span>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Operational</span>
                      <button className="text-gray-400 hover:text-yellow-400">⭐</button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      Last Dividend: <span className="text-white">£45.30</span>
                    </span>
                    <span>
                      Token Value: <span className="text-white">£200</span>
                    </span>
                    <span>
                      Performance: <span className="text-green-400">On Target</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Card 2 */}
              <div className="bg-[#1a1f2e] border border-[#252a3a] rounded-lg p-4 flex gap-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">Cornwall Solar panel</h3>
                      <span className="text-xs text-gray-400">(Equity)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-400">🔧 At-Risk</span>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
                      <button className="text-gray-400 hover:text-yellow-400">⭐</button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      Current Allocation: <span className="text-white">Connecting to grid</span>
                    </span>
                    <span>
                      Token Value: <span className="text-white">£100</span>
                    </span>
                    <span>
                      Performance: <span className="text-green-400">Exceeding Target</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Card 3 */}
              <div className="bg-[#1a1f2e] border border-[#252a3a] rounded-lg p-4 flex gap-4">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-lg flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">Devon Wind Turbine Expansion</h3>
                      <span className="text-xs text-gray-400">(Loan)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded">VOTING</span>
                      <button className="text-gray-400 hover:text-yellow-400">⭐</button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      Participant: <span className="text-white">$932</span>
                    </span>
                    <span>
                      Token Value: <span className="text-white">£100</span>
                    </span>
                    <span>
                      Voting Progress: <span className="text-pink-400">40%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Card 4 */}
              <div className="bg-[#1a1f2e] border border-[#252a3a] rounded-lg p-4 flex gap-4">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-lg flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">Devon Wind Turbine Expansion</h3>
                      <span className="text-xs text-gray-400">(Loan)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">FUNDING</span>
                      <button className="text-gray-400 hover:text-yellow-400">⭐</button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      Raised Amount: <span className="text-white">£9.0m</span>
                    </span>
                    <span>
                      Token Value: <span className="text-white">£100</span>
                    </span>
                    <span>
                      Closing Date: <span className="text-white">14-12-2025</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diversification */}
          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Diversification</h2>
            <div className="flex items-center justify-center mb-6">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#151E2F80" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-gray-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-6 flex items-center gap-4">
            <div className="text-4xl">🏢</div>
            <div>
              <h3 className="font-bold text-lg">INFRAFUND</h3>
              <p className="text-xs text-gray-400">Infrastructure Investment Platform</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-6 flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="font-bold text-lg">INFRAFUND</h3>
              <p className="text-xs text-gray-400">Infrastructure Investment Platform</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-6 flex items-center gap-4">
            <div className="text-4xl">💼</div>
            <div>
              <h3 className="font-bold text-lg">INFRAFUND</h3>
              <p className="text-xs text-gray-400">Infrastructure Investment Platform</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-card-bg">
          <button className="pb-3 px-4 text-yellow-400 border-b-2 border-yellow-400 flex items-center gap-2">
            ⭐ My Watchlist
          </button>
          <button className="pb-3 px-4 text-gray-400 hover:text-white flex items-center gap-2">
            🔥 Top Opportunities
          </button>
          <button className="pb-3 px-4 text-gray-400 hover:text-white flex items-center gap-2">
            📈 Trending Tokens (24h)
          </button>
          <button className="pb-3 px-4 text-gray-400 hover:text-white flex items-center gap-2">
            🆕 Newest Projects
          </button>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-4">
          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-4 flex gap-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-lg flex-shrink-0 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">Scottish Highlands Hydro Revenue</h3>
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded mt-1 inline-block">
                    STARTUP BOOST
                  </span>
                </div>
                <button className="text-yellow-400">⭐</button>
              </div>
              <div className="flex gap-6 text-xs text-gray-400 mb-2">
                <span>
                  Token Price: <span className="text-white">3 USDC</span>
                </span>
                <span>Bounty %</span>
                <span>
                  Projected IRR: <span className="text-green-400">54.2%</span>
                </span>
                <span>
                  Launch: <span className="text-white">Oct 21, 2025</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Raised Amount</span>
                <div className="flex-1 bg-[#1a1f2e] rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: "93%" }}></div>
                </div>
                <span className="text-xs text-green-400">1,859,000/2,000,000 USDC</span>
              </div>
            </div>
          </div>

          <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-4 flex gap-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-lg flex-shrink-0 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">Scottish Highlands Hydro Revenue</h3>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded mt-1 inline-block">
                    FUNDING
                  </span>
                </div>
                <button className="text-yellow-400">⭐</button>
              </div>
              <div className="flex gap-6 text-xs text-gray-400 mb-2">
                <span>
                  Token Price: <span className="text-white">2 USDC</span>
                </span>
                <span>Bounty %</span>
                <span>
                  Projected IRR: <span className="text-green-400">54.2%</span>
                </span>
                <span>
                  Launch: <span className="text-white">Oct 21, 2025</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Raised Amount</span>
                <div className="flex-1 bg-[#1a1f2e] rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: "42.5%" }}></div>
                </div>
                <span className="text-xs text-green-400">850,000/2,000,000 USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#151E2F80] border border-card-bg rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-card-bg">
                  <th className="pb-3 font-medium">DATE</th>
                  <th className="pb-3 font-medium">TYPE</th>
                  <th className="pb-3 font-medium">PROJECT</th>
                  <th className="pb-3 font-medium">AMOUNT</th>
                  <th className="pb-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-card-bg">
                  <td className="py-3 text-gray-400">Oct 21, 2025</td>
                  <td className="py-3">Dividend</td>
                  <td className="py-3">Exeter Solar</td>
                  <td className="py-3 text-green-400">+£45.19</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Paid</span>
                  </td>
                </tr>
                <tr className="border-b border-card-bg">
                  <td className="py-3 text-gray-400">Oct 15, 2025</td>
                  <td className="py-3">Investment</td>
                  <td className="py-3">Kenya Seagrass</td>
                  <td className="py-3 text-red-400">-£500.00</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Confirmed</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-400">Oct 1, 2025</td>
                  <td className="py-3">Loan Repayment</td>
                  <td className="py-3">Devon Wind</td>
                  <td className="py-3 text-green-400">+£32.50</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Paid</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-400 text-sm hover:underline">View Full Transaction History</button>
          </div>
        </div>
      </div>
  )
}
