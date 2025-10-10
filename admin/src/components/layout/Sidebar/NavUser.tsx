'use client';

import { useAuth } from '@/core/auth/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/elements/Avatar';
import { mediaService } from '@/components/media/services';
import { cn } from '@/core/utils/cn';


interface NavUserProps {
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NavUser({ className, showName = false, size = 'md' }: NavUserProps) {
  const { user } = useAuth();


  // Show immediate fallback while auth loads
  const displayUser = user || {
    full_name: "کاربر",
    email: 'user@example.com',
    is_super: false,
    profile: null
  };

  // Get user display name
  const getDisplayName = () => {
    if (displayUser.profile?.full_name) {
      return displayUser.profile.full_name;
    }
    if (displayUser.full_name) {
      return displayUser.full_name;
    }
    if (displayUser.profile?.first_name && displayUser.profile?.last_name) {
      return `${displayUser.profile.first_name} ${displayUser.profile.last_name}`;
    }
    return displayUser.email || 'کاربر';
  };

  // Get user initials
  const getInitials = () => {
    const name = getDisplayName();
    const words = name.trim().split(' ');
    
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`;
    }
    
    return name.charAt(0).toUpperCase();
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (displayUser.profile?.profile_picture?.url) {
      return mediaService.getUserProfileImageUrl(displayUser.profile.profile_picture.url);
    }
    return null;
  };

  const displayName = getDisplayName();
  const initials = getInitials();
  const profileImageUrl = getProfileImageUrl();

  return (
    <div className={cn("flex items-center space-x-2 space-x-reverse", className)}>
      <Avatar className={cn(
        "border-2 border-border",
        size === 'sm' && "h-8 w-8",
        size === 'md' && "h-10 w-10",
        size === 'lg' && "h-12 w-12"
      )}>
        <AvatarImage 
          src={profileImageUrl || undefined} 
          alt={displayName}
          className="object-cover"
        />
        <AvatarFallback className={cn(
          "bg-primary text-primary-foreground font-medium",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showName && (
        <div className="flex flex-col min-w-0">
          <span className={cn(
            "font-medium text-foreground truncate",
            size === 'sm' && "text-sm",
            size === 'md' && "text-sm",
            size === 'lg' && "text-base"
          )}>
            {displayName}
          </span>
          <span className={cn(
            "text-muted-foreground truncate",
            size === 'sm' && "text-xs",
            size === 'md' && "text-xs",
            size === 'lg' && "text-sm"
          )}>
            {displayUser.is_super ? 'مدیر ارشد' : 'مدیر'}
          </span>
        </div>
      )}
    </div>
  );
}
