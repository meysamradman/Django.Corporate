'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card'
import { Badge } from '@/components/elements/Badge'
import { CustomTooltipProvider } from '@/components/elements/Tooltip'
import { Skeleton } from '@/components/elements/Skeleton'
import { Shield, Users, Crown, UserCheck, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admins/route'
import { getUserRoleDisplayText } from '@/core/config/roles'

interface AdminRole {
  id: number
  name: string
  display_name: string
  permissions: {
    modules?: string[]
    actions?: string[]
  }
}

interface AdminWithRoles {
  id: number
  public_id: string
  email: string
  mobile: string
  full_name: string
  is_active: boolean
  is_super: boolean
  roles: AdminRole[]
}

export const RolesSection: React.FC = () => {
  // Get current admin profile
  const { data: currentAdmin, isLoading, error } = useQuery({
    queryKey: ['current-admin-profile'],
    queryFn: async () => {
      const response = await adminApi.getProfile()
      return response as unknown as AdminWithRoles
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const currentRoles = currentAdmin?.roles || []

  // Use centralized role display function
  const roleDisplayText = getUserRoleDisplayText(currentAdmin)

  // Debug log to see what we're getting from API
  React.useEffect(() => {
    if (currentAdmin) {
      // Removed debug logs to prevent console output
      // console.log('🔍 Current Admin Debug:', {
      //   id: currentAdmin.id,
      //   full_name: currentAdmin.full_name,
      //   is_super: currentAdmin.is_super,
      //   roles_count: currentAdmin.roles?.length || 0,
      //   roles_data: currentAdmin.roles,
      //   raw_admin: currentAdmin
      // })
      
      // More detailed check for super admin
      // if (currentAdmin.is_super) {
      //   console.log('🟠 SUPERUSER DETECTED:', {
      //     should_have_roles: true,
      //     actual_roles: currentAdmin.roles,
      //     roles_length: currentAdmin.roles?.length,
      //     is_array: Array.isArray(currentAdmin.roles),
      //     roles_type: typeof currentAdmin.roles
      //   })
      // }
    }
  }, [currentAdmin])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            نقش‌های ادمین‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            نقش‌های ادمین‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">خطا در بارگذاری نقش‌ها</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              تلاش مجدد
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRoles = currentRoles.length

  return (
    <CustomTooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            نقش‌های من
            <Badge variant="outline" className="ml-2">
              {roleDisplayText}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>هیچ نقشی به شما اختصاص داده نشده</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentRoles.filter(role => role && role.id).map((role) => {
                const rolePermissions = role?.permissions || {}
                const modules = rolePermissions.modules || []
                const actions = rolePermissions.actions || []
                
                // Create a simple display of modules and actions
                const permissionSummary = {
                  modules: modules,
                  actions: actions,
                  totalCount: modules.length + actions.length
                }

                return (
                  <div key={role.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {role.name?.includes('سوپر') || role.name?.includes('Super') ? (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        ) : role.name?.includes('مدیر') || role.name?.includes('manager') ? (
                          <Shield className="h-4 w-4 text-blue-500" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        )}
                        <h3 className="font-semibold text-sm">{role.display_name || role.name || 'نقش بدون نام'}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {permissionSummary.totalCount} دسترسی
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Modules */}
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">ماژول‌ها:</span>
                        <div className="flex flex-wrap gap-1">
                          {modules.map((module: string, index: number) => (
                            <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                              {module === 'admin' ? 'مدیریت' : 
                               module === 'portfolio' ? 'نمونه کارها' :
                               module === 'blog' ? 'بلاگ' :
                               module === 'media' ? 'رسانه' :
                               module === 'user' ? 'کاربران' :
                               module === 'statistics' ? 'آمار' :
                               module === 'settings' ? 'تنظیمات' :
                               module}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">عملیات‌ها:</span>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action: string, index: number) => (
                            <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border">
                              {action === 'create' ? 'ایجاد' :
                               action === 'read' ? 'مشاهده' :
                               action === 'update' ? 'ویرایش' :
                               action === 'delete' ? 'حذف' :
                               action === 'export' ? 'خروجی' :
                               action}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </CustomTooltipProvider>
  )
}