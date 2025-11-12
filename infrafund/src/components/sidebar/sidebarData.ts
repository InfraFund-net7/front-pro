import { type } from "os";

type Role = "gc" | "client" | "investor" | "auditor";
type UserType = "individual" | "business";

interface NavItem {
  title: string;
  url: string;
  icon: string;
  disabled?: boolean;
  children?: NavItem[];
}

export const NAVIGATION: Record<
  Role,
  Record<UserType, { verified: NavItem[]; unverified: NavItem[] }>
> = {
  client: {
    individual: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "KYC", url: "/kyc", icon: "FileText" },
        { title: "Explore Projects", url: "/explore-projects", icon: "Magnet" },
        { title: "Swap", url: "/swap", icon: "ArrowUpDown" },
        { title: "Setting", url: "/setting", icon: "Compass" },
      ],
      unverified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "KYC", url: "/kyc", icon: "FileText" },
        {
          title: "Explore Projects",
          url: "/explore-projects",
          icon: "Magnet",
          disabled: true,
        },
      ],
    },
    business: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "KYB", url: "/kyb", icon: "FileText" },
        { title: "Create Project", url: "/create-project", icon: "Rocket" },
        { title: "Tokenization", url: "/tokenization", icon: "Layers" },
        {
          title: "Investment Portal",
          url: "/investment-portal",
          icon: "Building",
        },
      ],
      unverified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "KYB", url: "/kyb", icon: "FileText" },
        {
          title: "Create Project",
          url: "/create-project",
          icon: "Rocket",
          disabled: true,
        },
      ],
    },
  },
  investor: {
    individual: {
      verified: [
        { title: "Swap", url: "/swap", icon: "ArrowUpDown" },
        { title: "Asset Managment", url: "/asset-managment", icon: "PieChart" },
        { title: "Explore Projects", url: "/explore-projects", icon: "Compass" },
        { title: "KYC", url: "/kyc", icon: "IdCard" },
      ],
      unverified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "Explore Projects", url: "/explore-projects", icon: "Compass" },
        { title: "KYC", url: "/kyc", icon: "IdCard" },
      ],
    },
    business: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        {
          title: "Investment Requests",
          url: "/investment-requests",
          icon: "TrendingUp",
        },
        {
          title: "Investor Management",
          url: "/investor-management",
          icon: "Users",
        },
      ],
      unverified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        {
          title: "Investor Management",
          url: "/investor-management",
          icon: "Users",
          disabled: true,
        },
      ],
    },
  },
  gc: {
    individual: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "Proposal Approval", url: "/proposal-approval", icon: "TrendingUp" },
      ],
      unverified: [{ title: "Dashboard", url: "/", icon: "Home" }],
    },
    business: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        { title: "Plan Approval", url: "/plan-approval", icon: "Layers" },
        { title: "Smart Contract", url: "/smart-contract", icon: "FileText" },
      ],
      unverified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        {
          title: "Plan Approval",
          url: "/plan-approval",
          icon: "Layers",
          disabled: true,
        },
      ],
    },
  },
  auditor: {
    individual: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        {
          title: "Blog",
          url: "/blog",
          icon: "BookOpen",
          children: [
            { title: "Dashboard", url: "/blog", icon: "LayoutDashboard" },
            { title: "Posts", url: "/blog/posts", icon: "FileText" },
            { title: "Comments", url: "/blog/comments", icon: "MessageSquare" },
            { title: "Categories", url: "/blog/categories", icon: "Folder" },
            { title: "Tags", url: "/blog/tags", icon: "Tag" },
          ],
        },
        { title: "AML Requests", url: "/aml-requests", icon: "TrendingUp" },
      ],
      unverified: [{ title: "Dashboard", url: "/", icon: "Home" }],
    },
    business: {
      verified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        {
          title: "KYC/KYB Requests",
          url: "/requests",
          icon: "FileText",
        },
        { title: "Smart Contract", url: "/smart-contract", icon: "FileText" },
      ],
      unverified: [
        { title: "Dashboard", url: "/", icon: "Home" },
        {
          title: "KYC/KYB Requests",
          url: "/requests",
          icon: "FileText",
          disabled: true,
        },
      ],
    },
  },
};
