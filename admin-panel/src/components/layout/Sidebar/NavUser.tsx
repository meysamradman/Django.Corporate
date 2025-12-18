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

  const displayUser = (user as any) || {
    full_name: "کاربر",
    email: 'user@example.com',
    is_superuser: false,
    profile: null
  };

  const getDisplayName = () => {
    if (displayUser.profile?.full_name) {
      return displayUser.profile.full_name;
    }
    if (displayUser.full_name) {
      return displayUser.full_name;
    }
    if (displayUser.first_name && displayUser.last_name) {
      return `${displayUser.first_name} ${displayUser.last_name}`;
    }
    if (displayUser.profile?.first_name && displayUser.profile?.last_name) {
      return `${displayUser.profile.first_name} ${displayUser.profile.last_name}`;
    }
    return displayUser.email || displayUser.mobile || 'کاربر';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const words = name.trim().split(' ');
    
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`;
    }
    
    return name.charAt(0).toUpperCase();
  };

  const getProfileImageUrl = () => {
    if (displayUser.profile?.profile_picture?.file_url) {
      return mediaService.getMediaUrlFromObject(displayUser.profile.profile_picture);
    }
    return null;
  };

  const displayName = getDisplayName();
  const initials = getInitials();
  const profileImageUrl = getProfileImageUrl();

  return (
    <div className={cn("flex items-center space-x-2 space-x-reverse", className)}>
      <Avatar className={cn(
        "border-2",
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
          "bg-primary text-static-w font-medium",
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
            "text-font-s truncate",
            size === 'sm' && "text-xs",
            size === 'md' && "text-xs",
            size === 'lg' && "text-sm"
          )}>
            {displayUser.is_superuser ? 'مدیر ارشد' : 'مدیر'}
          </span>
        </div>
      )}
    </div>
  );
}

