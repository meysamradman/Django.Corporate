import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Image,
  LayoutPanelLeft,
  BookOpenText,
  Folder,
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
  Building2,
  UserCheck,
  Store,
  Layers,
  MapPin,
  Star,
  ImageIcon,
  Video,
  Music,
  FileText,
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
    'blog.category': <Folder className="h-4 w-4 text-emerald-600" />,
    'blog.tag': <Tag className="h-4 w-4 text-teal-600" />,
    'portfolio.category': <Folder className="h-4 w-4 text-cyan-600" />,
    'portfolio.tag': <Tag className="h-4 w-4 text-sky-600" />,
    'portfolio.option': <ListTree className="h-4 w-4 text-violet-600" />,
    'portfolio.option_value': <ListChecks className="h-4 w-4 text-fuchsia-600" />,
    
    // Legacy support (with underscore)
    blog_categories: <Folder className="h-4 w-4 text-emerald-600" />,
    blog_tags: <Tag className="h-4 w-4 text-teal-600" />,
    portfolio_categories: <Folder className="h-4 w-4 text-cyan-600" />,
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
    
    // Real Estate
    real_estate: <Building2 className="h-4 w-4 text-orange-600" />,
    'real_estate.property': <Building2 className="h-4 w-4 text-orange-600" />,
    'real_estate.agent': <UserCheck className="h-4 w-4 text-blue-600" />,
    'real_estate.agency': <Store className="h-4 w-4 text-purple-600" />,
    'real_estate.type': <Layers className="h-4 w-4 text-indigo-600" />,
    'real_estate.state': <MapPin className="h-4 w-4 text-green-600" />,
    'real_estate.label': <Tag className="h-4 w-4 text-pink-600" />,
    'real_estate.feature': <Star className="h-4 w-4 text-yellow-600" />,
    'real_estate.tag': <Tag className="h-4 w-4 text-teal-600" />,
    
    // Media subtypes
    'media.image': <ImageIcon className="h-4 w-4 text-pink-600" />,
    'media.video': <Video className="h-4 w-4 text-red-600" />,
    'media.audio': <Music className="h-4 w-4 text-purple-600" />,
    'media.document': <FileText className="h-4 w-4 text-blue-600" />,
  };

  // Fallback برای resource keys با dot notation
  if (!resourceIconMap[resourceKey]) {
    // اگر resource key با blog شروع شود
    if (resourceKey.startsWith('blog.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'category':
            return <Folder className="h-4 w-4 text-emerald-600" />;
          case 'tag':
            return <Tag className="h-4 w-4 text-teal-600" />;
        }
      }
    }
    
    // اگر resource key با portfolio شروع شود
    if (resourceKey.startsWith('portfolio.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'category':
            return <Folder className="h-4 w-4 text-cyan-600" />;
          case 'tag':
            return <Tag className="h-4 w-4 text-sky-600" />;
          case 'option':
            return <ListTree className="h-4 w-4 text-violet-600" />;
        }
      }
      // برای portfolio.option.value
      if (parts.length > 2 && parts[1] === 'option' && parts[2] === 'value') {
        return <ListChecks className="h-4 w-4 text-fuchsia-600" />;
      }
    }
    
    // اگر resource key با real_estate شروع شود
    if (resourceKey.startsWith('real_estate.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'property':
            return <Building2 className="h-4 w-4 text-orange-600" />;
          case 'agent':
            return <UserCheck className="h-4 w-4 text-blue-600" />;
          case 'agency':
            return <Store className="h-4 w-4 text-purple-600" />;
          case 'type':
            return <Layers className="h-4 w-4 text-indigo-600" />;
          case 'state':
            return <MapPin className="h-4 w-4 text-green-600" />;
          case 'label':
            return <Tag className="h-4 w-4 text-pink-600" />;
          case 'feature':
            return <Star className="h-4 w-4 text-yellow-600" />;
          case 'tag':
            return <Tag className="h-4 w-4 text-teal-600" />;
        }
      }
    }
    
    // اگر resource key با media شروع شود
    if (resourceKey.startsWith('media.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'image':
            return <ImageIcon className="h-4 w-4 text-pink-600" />;
          case 'video':
            return <Video className="h-4 w-4 text-red-600" />;
          case 'audio':
            return <Music className="h-4 w-4 text-purple-600" />;
          case 'document':
            return <FileText className="h-4 w-4 text-blue-600" />;
        }
      }
    }
  }

  return resourceIconMap[resourceKey] || <Shield className="h-4 w-4" />;
}

