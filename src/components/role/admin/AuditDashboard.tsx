export default function AuditDashboard() {
    const stats = [
        { label: "Audits Pending", value: "5" },
        { label: "Audits Completed [90d]", value: "15" },
        { label: "Avg. Turnaround Time", value: "48 hours" },
    ]

    const audits = [
        {
            project: "Exeter Community Solar Farm",
            auditType: "Milestone Verification",
            target: "Milestone 3: Foundations Complete",
            dueDate: "Oct 28, 2025",
            status: "AWAITING",
            statusColor: "bg-yellow-600",
            priority: "High",
            priorityColor: "text-red-400",
        },
        {
            project: "Kenya Seagrass Protection (ReFi)",
            auditType: "Impact Verification",
            target: "Q3 Carbon Sequestration Report",
            dueDate: "Nov 5, 2025",
            status: "PENDING REVIEW",
            statusColor: "bg-blue-600",
            priority: "Medium",
            priorityColor: "text-yellow-400",
        },
        {
            project: "Devon Wind Turbine Expansion",
            auditType: "Proposal Approval",
            target: "v1.1 Staking Contract",
            dueDate: "Nov 10, 2025",
            status: "NOT STARTED",
            statusColor: "bg-gray-600",
            priority: "Medium",
            priorityColor: "text-yellow-400",
        },
        {
            project: "Cornwall Wind Turbine Farm",
            auditType: "Pledge Approval",
            target: "Funding Preparation",
            dueDate: "Nov 14, 2025",
            status: "AWAITING",
            statusColor: "bg-yellow-600",
            priority: "Low",
            priorityColor: "text-green-400",
        },
        {
            project: "Geothermal Wells",
            auditType: "Auction Approval",
            target: "Withdrawal Preparation",
            dueDate: "Dec 3, 2025",
            status: "AWAITING",
            statusColor: "bg-yellow-600",
            priority: "High",
            priorityColor: "text-red-400",
        },
    ]

    const activityLog = [
        {
            title: "Audit Report Submitted (Milestone 1)",
            subtitle: "(Cornwall Geothermal)",
            date: "Oct 18, 2025",
            status: "APPROVED",
            statusColor: "bg-green-600",
        },
        {
            title: "Document Request (Milestone 2)",
            subtitle: "(Exeter Solar)",
            date: "Oct 15, 2025",
            status: "SENT",
            statusColor: "bg-blue-600",
        },
    ]

    return (
        <div className="w-full text-white">
            <div className="w-full mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-[#151E2F80]  border border-card-bg rounded-lg p-6"
                        >
                            <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                            <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                    ))}
                </div>
                <div className="bg-[#151E2F80]  border border-card-bg rounded-lg overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-card-bg">
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Project</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Audit Type</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Target</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Due Date</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Status</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Priority</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audits.map((audit, index) => (
                                    <tr key={index} className="border-b border-card-bg hover:bg-gray-900/50 transition-colors">
                                        <td className="py-4 px-6 font-medium">{audit.project}</td>
                                        <td className="py-4 px-6 text-gray-300 text-sm">{audit.auditType}</td>
                                        <td className="py-4 px-6 text-gray-300 text-sm">{audit.target}</td>
                                        <td className="py-4 px-6 text-gray-300 text-sm">{audit.dueDate}</td>
                                        <td className="py-4 px-6">
                                            <span className={`${audit.statusColor} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                                                {audit.status}
                                            </span>
                                        </td>
                                        <td className={`py-4 px-6 ${audit.priorityColor} text-sm font-medium`}>{audit.priority}</td>
                                        <td className="py-4 px-6">
                                            <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                                                Start Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Recent Audit Activity Log</h2>
                    <div className="space-y-4">
                        {activityLog.map((activity, index) => (
                            <div
                                key={index}
                                className="bg-[#151E2F80]  border border-card-bg rounded-lg p-6 flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-white mb-1">
                                        <span className="font-medium">{activity.title}</span>{" "}
                                        <span className="text-gray-400">{activity.subtitle}</span>
                                    </div>
                                    <div className="text-gray-500 text-sm">{activity.date}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`${activity.statusColor} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                                        {activity.status}
                                    </span>
                                    <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* View Full History Button */}
                <div className="text-center">
                    <button className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                        View Full Audit History
                    </button>
                </div>
            </div>
        </div>
    )
}
