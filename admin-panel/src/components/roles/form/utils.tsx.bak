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
    dashboard: <LayoutDashboard className="h-4 w-4 text-blue-1" />,
    users: <Users className="h-4 w-4 text-blue-1" />,
    admin: <ShieldCheck className="h-4 w-4 text-purple-1" />,
    media: <Image className="h-4 w-4 text-pink-1" />,
    portfolio: <LayoutPanelLeft className="h-4 w-4 text-indigo-1" />,
    blog: <BookOpenText className="h-4 w-4 text-green-1" />,
    'blog.category': <Folder className="h-4 w-4 text-emerald-1" />,
    'blog.tag': <Tag className="h-4 w-4 text-teal-1" />,
    'portfolio.category': <Folder className="h-4 w-4 text-teal-1" />,
    'portfolio.tag': <Tag className="h-4 w-4 text-blue-1" />,
    'portfolio.option': <ListTree className="h-4 w-4 text-purple-1" />,
    'portfolio.option_value': <ListChecks className="h-4 w-4 text-pink-1" />,
    
    blog_categories: <Folder className="h-4 w-4 text-emerald-1" />,
    blog_tags: <Tag className="h-4 w-4 text-teal-1" />,
    portfolio_categories: <Folder className="h-4 w-4 text-teal-1" />,
    portfolio_tags: <Tag className="h-4 w-4 text-blue-1" />,
    portfolio_options: <ListTree className="h-4 w-4 text-purple-1" />,
    portfolio_option_values: <ListChecks className="h-4 w-4 text-pink-1" />,
    analytics: <BarChart3 className="h-4 w-4 text-amber-1" />,
    statistics: <PieChart className="h-4 w-4 text-orange-1" />,
    panel: <Settings className="h-4 w-4 text-gray-1" />,
    settings: <Settings className="h-4 w-4 text-gray-1" />,
    ai: <Sparkles className="h-4 w-4 text-yellow-1" />,
    chatbot: <MessageSquare className="h-4 w-4 text-teal-1" />,
    email: <Mail className="h-4 w-4 text-red-1" />,
    ticket: <Ticket className="h-4 w-4 text-blue-1" />,
    forms: <SquarePen className="h-4 w-4 text-green-1" />,
    pages: <BookOpenCheck className="h-4 w-4 text-pink-1" />,
    
    real_estate: <Building2 className="h-4 w-4 text-orange-1" />,
    'real_estate.property': <Building2 className="h-4 w-4 text-orange-1" />,
    'real_estate.agent': <UserCheck className="h-4 w-4 text-blue-1" />,
    'real_estate.agency': <Store className="h-4 w-4 text-purple-1" />,
    'real_estate.type': <Layers className="h-4 w-4 text-indigo-1" />,
    'real_estate.listing_type': <MapPin className="h-4 w-4 text-green-1" />,
    'real_estate.label': <Tag className="h-4 w-4 text-pink-1" />,
    'real_estate.feature': <Star className="h-4 w-4 text-yellow-1" />,
    'real_estate.tag': <Tag className="h-4 w-4 text-teal-1" />,
    
    'media.image': <ImageIcon className="h-4 w-4 text-pink-1" />,
    'media.video': <Video className="h-4 w-4 text-red-1" />,
    'media.audio': <Music className="h-4 w-4 text-purple-1" />,
    'media.document': <FileText className="h-4 w-4 text-blue-1" />,
  };

  if (!resourceIconMap[resourceKey]) {
    if (resourceKey.startsWith('blog.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'category':
            return <Folder className="h-4 w-4 text-emerald-1" />;
          case 'tag':
            return <Tag className="h-4 w-4 text-teal-1" />;
        }
      }
    }
    
    if (resourceKey.startsWith('portfolio.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'category':
            return <Folder className="h-4 w-4 text-teal-1" />;
          case 'tag':
            return <Tag className="h-4 w-4 text-blue-1" />;
          case 'option':
            return <ListTree className="h-4 w-4 text-purple-1" />;
        }
      }
      if (parts.length > 2 && parts[1] === 'option' && parts[2] === 'value') {
        return <ListChecks className="h-4 w-4 text-pink-1" />;
      }
    }
    
    if (resourceKey.startsWith('real_estate.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'property':
            return <Building2 className="h-4 w-4 text-orange-1" />;
          case 'agent':
            return <UserCheck className="h-4 w-4 text-blue-1" />;
          case 'agency':
            return <Store className="h-4 w-4 text-purple-1" />;
          case 'type':
            return <Layers className="h-4 w-4 text-indigo-1" />;
          case 'state':
            return <MapPin className="h-4 w-4 text-green-1" />;
          case 'label':
            return <Tag className="h-4 w-4 text-pink-1" />;
          case 'feature':
            return <Star className="h-4 w-4 text-yellow-1" />;
          case 'tag':
            return <Tag className="h-4 w-4 text-teal-1" />;
        }
      }
    }
    
    if (resourceKey.startsWith('media.')) {
      const parts = resourceKey.split('.');
      if (parts.length > 1) {
        const subResource = parts[1];
        switch (subResource) {
          case 'image':
            return <ImageIcon className="h-4 w-4 text-pink-1" />;
          case 'video':
            return <Video className="h-4 w-4 text-red-1" />;
          case 'audio':
            return <Music className="h-4 w-4 text-purple-1" />;
          case 'document':
            return <FileText className="h-4 w-4 text-blue-1" />;
        }
      }
    }
  }

  return resourceIconMap[resourceKey] || <Shield className="h-4 w-4" />;
}

