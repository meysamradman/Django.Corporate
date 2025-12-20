import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Image,
  LayoutPanelLeft,
  BookOpenText,
  FolderTree,
  Tags,
  Component,
  Tag,
  ListTree,
  ListChecks,
  BarChart3,
  PieChart,
  Settings,
  Sparkles,
  MessageSquare,
  Mail,
  Ticket,
  SquarePen,
  BookOpenCheck,
  Shield,
} from "lucide-react";
import type { ReactElement } from "react";

export function getResourceIcon(resourceKey: string): ReactElement {
  const resourceIconMap: Record<string, ReactElement> = {
    dashboard: <LayoutDashboard className="h-4 w-4 text-blue-600" />,
    users: <Users className="h-4 w-4 text-blue-600" />,
    admin: <ShieldCheck className="h-4 w-4 text-purple-600" />,
    media: <Image className="h-4 w-4 text-pink-600" />,
    portfolio: <LayoutPanelLeft className="h-4 w-4 text-indigo-600" />,
    blog: <BookOpenText className="h-4 w-4 text-green-600" />,
    blog_categories: <FolderTree className="h-4 w-4 text-emerald-600" />,
    blog_tags: <Tags className="h-4 w-4 text-teal-600" />,
    portfolio_categories: <Component className="h-4 w-4 text-cyan-600" />,
    portfolio_tags: <Tag className="h-4 w-4 text-sky-600" />,
    portfolio_options: <ListTree className="h-4 w-4 text-violet-600" />,
    portfolio_option_values: <ListChecks className="h-4 w-4 text-fuchsia-600" />,
    analytics: <BarChart3 className="h-4 w-4 text-amber-600" />,
    statistics: <PieChart className="h-4 w-4 text-orange-600" />,
    panel: <Settings className="h-4 w-4 text-slate-600" />,
    settings: <Settings className="h-4 w-4 text-gray-600" />,
    ai: <Sparkles className="h-4 w-4 text-yellow-600" />,
    chatbot: <MessageSquare className="h-4 w-4 text-cyan-600" />,
    email: <Mail className="h-4 w-4 text-red-600" />,
    ticket: <Ticket className="h-4 w-4 text-blue-600" />,
    forms: <SquarePen className="h-4 w-4 text-lime-600" />,
    pages: <BookOpenCheck className="h-4 w-4 text-rose-600" />,
  };

  return resourceIconMap[resourceKey] || <Shield className="h-4 w-4" />;
}

