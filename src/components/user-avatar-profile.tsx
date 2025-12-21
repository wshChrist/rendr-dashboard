import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@supabase/supabase-js';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: User | null;
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user
}: UserAvatarProfileProps) {
  if (!user) return null;

  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
    user.email?.split('@')[0] ||
    'User';
  const email = user.email || '';
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>{displayName}</span>
          <span className='truncate text-xs'>{email}</span>
        </div>
      )}
    </div>
  );
}
