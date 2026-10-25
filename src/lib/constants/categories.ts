import {
  Tag,
  UtensilsCrossed,
  Car,
  Home,
  HeartPulse,
  PartyPopper,
  Receipt,
  Gift,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export interface DefaultCategory {
  name: string;
  iconName: string;
  icon: LucideIcon;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Aucune", iconName: "Tag", icon: Tag },
  { name: "Alimentation", iconName: "UtensilsCrossed", icon: UtensilsCrossed },
  { name: "Transport", iconName: "Car", icon: Car },
  { name: "Logement", iconName: "Home", icon: Home },
  { name: "Santé", iconName: "HeartPulse", icon: HeartPulse },
  { name: "Loisirs", iconName: "PartyPopper", icon: PartyPopper },
  { name: "Factures", iconName: "Receipt", icon: Receipt },
  { name: "Don", iconName: "Gift", icon: Gift },
  { name: "Autre", iconName: "ShoppingBag", icon: ShoppingBag },
];

export function getCategoryIcon(categoryName: string): LucideIcon {
  if (categoryName === "Aucun" || categoryName === "Aucune") return Tag;
  const found = DEFAULT_CATEGORIES.find((c) => c.name === categoryName);
  return found ? found.icon : Tag;
}
