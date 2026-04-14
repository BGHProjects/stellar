import { ArrowRight, Globe, Ruler, Zap } from "lucide-react";

export const BODY_NAMES: Record<string, string> = {
  aethon: "Aethon",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  calyx: "Calyx",
  lun: "Lun",
  vael: "Vael",
  l4_station: "L4 Station",
  l5_station: "L5 Station",
};

export const SORT_OPTIONS = [
  { value: "window_desc", label: "Best Window" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "duration_asc", label: "Shortest" },
  { value: "date_asc", label: "Earliest" },
];

export const ROUTE_TYPE_META: Record<
  string,
  { label: string; color: string; description: string; icon: React.ReactNode }
> = {
  direct: {
    label: "Direct Transfer",
    color: "text-white",
    description: "Fastest. Point to point.",
    icon: <Zap className="w-3 h-3" />,
  },
  gravity_assist: {
    label: "Gravity Assist",
    color: "text-accent-300",
    description: "Fuel-efficient via planetary slingshot.",
    icon: <Globe className="w-3 h-3" />,
  },
  multi_stop: {
    label: "Multi-Stop",
    color: "text-white/60",
    description: "Calls at multiple ports. Cheapest.",
    icon: <ArrowRight className="w-3 h-3" />,
  },
  scenic: {
    label: "Scenic Voyage",
    color: "text-warning",
    description: "Passes astrophysical phenomena. Premium.",
    icon: <Ruler className="w-3 h-3" />,
  },
};
