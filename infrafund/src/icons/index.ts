import dynamic from "next/dynamic";

export const Home = dynamic(() => import("lucide-react").then((mod) => mod.Home), { ssr: false });
export const Layers = dynamic(() => import("lucide-react").then((mod) => mod.Layers), { ssr: false });
export const Building = dynamic(() => import("lucide-react").then((mod) => mod.Building), { ssr: false });
export const Grid3X3 = dynamic(() => import("lucide-react").then((mod) => mod.Grid3X3), { ssr: false });
export const Users = dynamic(() => import("lucide-react").then((mod) => mod.Users), { ssr: false });
export const TrendingUp = dynamic(() => import("lucide-react").then((mod) => mod.TrendingUp), { ssr: false });
export const Folder = dynamic(() => import("lucide-react").then((mod) => mod.Folder), { ssr: false });
export const Compass = dynamic(() => import("lucide-react").then((mod) => mod.Compass), { ssr: false });
export const ArrowUpDown = dynamic(() => import("lucide-react").then((mod) => mod.ArrowUpDown), { ssr: false });
export const FileText = dynamic(() => import("lucide-react").then((mod) => mod.FileText), { ssr: false });
export const Lock = dynamic(() => import("lucide-react").then((mod) => mod.Lock), { ssr: false });
export const Rocket = dynamic(() => import("lucide-react").then((mod) => mod.Rocket), { ssr: false });
export const Magnet = dynamic(() => import("lucide-react").then((mod) => mod.Magnet), { ssr: false });
export const Landmark = dynamic(() => import("lucide-react").then((mod) => mod.Landmark), { ssr: false });
export const IdCard = dynamic(() => import("lucide-react").then((mod) => mod.IdCard), { ssr: false });
