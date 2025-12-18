export const getUserRoleDisplayText = (user: any): string => {
  if (!user) return 'بدون نقش';
  
  const roles = user.roles || [];
  
  if (roles.length === 0) return 'بدون نقش';
  
  if (user.is_super || user.is_superuser || roles.some((role: any) => 
    role === 'super_admin' || role?.name === 'super_admin'
  )) {
    return 'مدیر ارشد';
  }
  
  const mainRole = roles[0];
  const roleName = typeof mainRole === 'string' ? mainRole : mainRole?.name;
  
  if (roleName) {
    return roleName;
  }
  
  return `${roles.length} نقش`;
};

