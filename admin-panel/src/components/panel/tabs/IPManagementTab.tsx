import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipManagementApi, type BannedIP } from '@/api/security/ipManagement';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/elements/Card';
import { Badge } from '@/components/elements/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/elements/Table';
import { Alert, AlertDescription } from '@/components/elements/Alert';
import { showSuccess, showError } from '@/core/toast';
import { Shield, ShieldOff, Ban, Unlock, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/elements/Dialog';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';
import { ProtectedButton } from '@/components/admins/permissions';

export function IPManagementTab() {
  const queryClient = useQueryClient();
  const [banIPDialog, setBanIPDialog] = useState(false);
  const [banIP, setBanIP] = useState('');
  const [banReason, setBanReason] = useState('');
  const [addWhitelistDialog, setAddWhitelistDialog] = useState(false);
  const [whitelistIP, setWhitelistIP] = useState('');

  // دریافت لیست IPهای ban شده
  const { data: bannedIPs = [], isLoading: loadingBanned } = useQuery({
    queryKey: ['banned-ips'],
    queryFn: ipManagementApi.getBannedIPs,
  });

  // دریافت IP فعلی
  const { data: currentIP } = useQuery({
    queryKey: ['current-ip'],
    queryFn: ipManagementApi.getCurrentIP,
  });

  // دریافت لیست whitelist
  const { data: whitelist = [], isLoading: loadingWhitelist } = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: ipManagementApi.getWhitelist,
  });

  // رفع ban
  const unbanMutation = useMutation({
    mutationFn: ipManagementApi.unbanIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      showSuccess('IP با موفقیت از ban خارج شد');
    },
    onError: () => {
      showError('خطا در رفع ban IP');
    },
  });

  // Ban کردن
  const banMutation = useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason?: string }) => ipManagementApi.banIP(ip, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      setBanIPDialog(false);
      setBanIP('');
      setBanReason('');
      showSuccess('IP با موفقیت ban شد');
    },
    onError: () => {
      showError('خطا در ban کردن IP');
    },
  });

  // اضافه کردن به whitelist
  const addToWhitelistMutation = useMutation({
    mutationFn: ipManagementApi.addToWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      setAddWhitelistDialog(false);
      setWhitelistIP('');
      showSuccess('IP با موفقیت به whitelist اضافه شد');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.metaData?.message || 'خطا در اضافه کردن IP به whitelist');
    },
  });

  // حذف از whitelist
  const removeFromWhitelistMutation = useMutation({
    mutationFn: ipManagementApi.removeFromWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      showSuccess('IP با موفقیت از whitelist حذف شد');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.metaData?.message || 'خطا در حذف IP از whitelist');
    },
  });

  // اضافه کردن IP فعلی به whitelist
  const addCurrentIPMutation = useMutation({
    mutationFn: ipManagementApi.addCurrentIPToWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      showSuccess('IP فعلی شما به whitelist اضافه شد');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.metaData?.message || 'خطا در اضافه کردن IP فعلی به whitelist');
    },
  });

  const handleUnban = (ip: string) => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید IP ${ip} را از ban خارج کنید؟`)) {
      unbanMutation.mutate(ip);
    }
  };

  const handleBan = () => {
    if (!banIP.trim()) {
      showError('لطفاً IP را وارد کنید');
      return;
    }
    banMutation.mutate({ ip: banIP.trim(), reason: banReason || undefined });
  };

  const handleAddToWhitelist = () => {
    if (!whitelistIP.trim()) {
      showError('لطفاً IP را وارد کنید');
      return;
    }
    addToWhitelistMutation.mutate(whitelistIP.trim());
  };

  const handleRemoveFromWhitelist = (ip: string) => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید IP ${ip} را از whitelist حذف کنید؟`)) {
      removeFromWhitelistMutation.mutate(ip);
    }
  };

  return (
    <div className="space-y-6">
      {/* IP فعلی */}
      {currentIP && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IP فعلی شما
            </CardTitle>
            <CardDescription>اطلاعات IP آدرس فعلی شما</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>IP Address</Label>
                <div className="mt-1 font-mono text-lg">{currentIP.ip}</div>
              </div>
              <div className="flex items-center gap-2">
                {currentIP.is_banned ? (
                  <Badge variant="red" className="gap-1">
                    <Ban className="h-3 w-3" />
                    Ban شده
                  </Badge>
                ) : (
                  <Badge variant="green" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    فعال
                  </Badge>
                )}
                {currentIP.is_whitelisted && (
                  <Badge variant="default" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Whitelist
                  </Badge>
                )}
              </div>
              <div>
                <Label>تعداد تلاش‌ها</Label>
                <div className="mt-1">
                  {currentIP.attempts} / {currentIP.max_attempts}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ban کردن IP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Ban کردن IP
          </CardTitle>
          <CardDescription>Ban کردن دستی یک IP address</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={banIPDialog} onOpenChange={setBanIPDialog}>
            <DialogTrigger asChild>
              <ProtectedButton variant="destructive" permission="panel.manage">
                <Ban className="h-4 w-4 mr-2" />
                Ban کردن IP جدید
              </ProtectedButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ban کردن IP</DialogTitle>
                <DialogDescription>
                  IP را وارد کنید تا ban شود
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ban-ip">IP Address</Label>
                  <Input
                    id="ban-ip"
                    value={banIP}
                    onChange={(e) => setBanIP(e.target.value)}
                    placeholder="192.168.1.100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ban-reason">دلیل (اختیاری)</Label>
                  <Textarea
                    id="ban-reason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="دلیل ban کردن این IP"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBanIPDialog(false)}>
                  انصراف
                </Button>
                <ProtectedButton 
                  variant="destructive" 
                  onClick={handleBan} 
                  disabled={banMutation.isPending}
                  permission="panel.manage"
                >
                  {banMutation.isPending ? 'در حال ban...' : 'Ban کردن'}
                </ProtectedButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* لیست IPهای ban شده */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5" />
            IPهای Ban شده
          </CardTitle>
          <CardDescription>لیست IPهای که ban شده‌اند</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBanned ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : bannedIPs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>هیچ IP ban شده‌ای وجود ندارد</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>دلیل</TableHead>
                  <TableHead>زمان Ban</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedIPs.map((banned: BannedIP) => (
                  <TableRow key={banned.ip}>
                    <TableCell className="font-mono">{banned.ip}</TableCell>
                    <TableCell>{banned.reason}</TableCell>
                    <TableCell>{banned.banned_at}</TableCell>
                    <TableCell className="text-right">
                      <ProtectedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(banned.ip)}
                        disabled={unbanMutation.isPending}
                        permission="panel.manage"
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        رفع Ban
                      </ProtectedButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* مدیریت Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IPهای Whitelist
          </CardTitle>
          <CardDescription>IPهای که در whitelist هستند و هرگز ban نمی‌شوند</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* دکمه اضافه کردن IP فعلی */}
          {currentIP && !currentIP.is_whitelisted && (
            <ProtectedButton
              variant="outline"
              onClick={() => addCurrentIPMutation.mutate()}
              disabled={addCurrentIPMutation.isPending}
              permission="panel.manage"
            >
              <Plus className="h-4 w-4 mr-2" />
              اضافه کردن IP فعلی ({currentIP.ip}) به Whitelist
            </ProtectedButton>
          )}

          {/* دکمه اضافه کردن IP جدید */}
          <Dialog open={addWhitelistDialog} onOpenChange={setAddWhitelistDialog}>
            <DialogTrigger asChild>
              <ProtectedButton variant="outline" permission="panel.manage">
                <Plus className="h-4 w-4 mr-2" />
                اضافه کردن IP جدید به Whitelist
              </ProtectedButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>اضافه کردن IP به Whitelist</DialogTitle>
                <DialogDescription>
                  IP را وارد کنید تا به whitelist اضافه شود
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="whitelist-ip">IP Address</Label>
                  <Input
                    id="whitelist-ip"
                    value={whitelistIP}
                    onChange={(e) => setWhitelistIP(e.target.value)}
                    placeholder="192.168.1.100"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddWhitelistDialog(false)}>
                  انصراف
                </Button>
                <ProtectedButton 
                  onClick={handleAddToWhitelist} 
                  disabled={addToWhitelistMutation.isPending}
                  permission="panel.manage"
                >
                  {addToWhitelistMutation.isPending ? 'در حال اضافه...' : 'اضافه کردن'}
                </ProtectedButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* لیست IPهای whitelist */}
          {loadingWhitelist ? (
            <div className="text-center py-4">در حال بارگذاری...</div>
          ) : whitelist.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>هیچ IP در whitelist وجود ندارد</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {whitelist.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="font-mono">{ip}</span>
                  {currentIP && currentIP.ip === ip && (
                    <Badge variant="default" className="text-xs">IP فعلی</Badge>
                  )}
                </div>
                {currentIP && currentIP.ip !== ip && (
                  <ProtectedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromWhitelist(ip)}
                    disabled={removeFromWhitelistMutation.isPending}
                    permission="panel.manage"
                    className="text-red-1 hover:text-red-2 hover:bg-red-1/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ProtectedButton>
                )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

