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
import { getError } from '@/core/messages/errors';
import { getSecurity } from '@/core/messages/ui';
import { Shield, ShieldOff, Ban, Unlock, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/elements/Dialog';
import { Label } from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Textarea';

export function IPManagementTab() {
  const queryClient = useQueryClient();
  const [banIPDialog, setBanIPDialog] = useState(false);
  const [banIP, setBanIP] = useState('');
  const [banReason, setBanReason] = useState('');
  const [addWhitelistDialog, setAddWhitelistDialog] = useState(false);
  const [whitelistIP, setWhitelistIP] = useState('');

  const { data: bannedIPs = [], isLoading: loadingBanned } = useQuery({
    queryKey: ['banned-ips'],
    queryFn: ipManagementApi.getBannedIPs,
  });

  const { data: currentIP } = useQuery({
    queryKey: ['current-ip'],
    queryFn: ipManagementApi.getCurrentIP,
  });

  const { data: whitelist = [], isLoading: loadingWhitelist } = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: ipManagementApi.getWhitelist,
  });

  const unbanMutation = useMutation({
    mutationFn: ipManagementApi.unbanIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      showSuccess(getSecurity('ipUnbanned'));
    },
    onError: () => {
      showError(getSecurity('ipUnbanError'));
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason?: string }) => ipManagementApi.banIP(ip, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      setBanIPDialog(false);
      setBanIP('');
      setBanReason('');
      showSuccess(getSecurity('ipBanned'));
    },
    onError: () => {
      showError(getSecurity('ipBanError'));
    },
  });

  const addToWhitelistMutation = useMutation({
    mutationFn: ipManagementApi.addToWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      setAddWhitelistDialog(false);
      setWhitelistIP('');
      showSuccess(getSecurity('ipWhitelisted'));
    },
    onError: (error: any) => {
      showError(error?.response?.data?.metaData?.message || getSecurity('ipWhitelistAddError'));
    },
  });

  const removeFromWhitelistMutation = useMutation({
    mutationFn: ipManagementApi.removeFromWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      showSuccess(getSecurity('ipWhitelistRemoved'));
    },
    onError: (error: any) => {
      showError(error?.response?.data?.metaData?.message || getSecurity('ipWhitelistRemoveError'));
    },
  });

  const addCurrentIPMutation = useMutation({
    mutationFn: ipManagementApi.addCurrentIPToWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['current-ip'] });
      queryClient.invalidateQueries({ queryKey: ['banned-ips'] });
      showSuccess(getSecurity('currentIpWhitelisted'));
    },
    onError: (error: any) => {
      showError(error?.response?.data?.metaData?.message || getSecurity('currentIpWhitelistAddError'));
    },
  });

  const handleUnban = (ip: string) => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید IP ${ip} را از ban خارج کنید؟`)) {
      unbanMutation.mutate(ip);
    }
  };

  const handleBan = () => {
    if (!banIP.trim()) {
      showError(getSecurity('ipRequired'));
      return;
    }
    banMutation.mutate({ ip: banIP.trim(), reason: banReason || undefined });
  };

  const handleAddToWhitelist = () => {
    if (!whitelistIP.trim()) {
      showError(getSecurity('ipRequired'));
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
              <Button variant="destructive">
                <Ban className="h-4 w-4 mr-2" />
                Ban کردن IP جدید
              </Button>
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
                <Button 
                  variant="destructive" 
                  onClick={handleBan} 
                  disabled={banMutation.isPending}
                >
                  {banMutation.isPending ? 'در حال ban...' : 'Ban کردن'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(banned.ip)}
                        disabled={unbanMutation.isPending}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        رفع Ban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IPهای Whitelist
          </CardTitle>
          <CardDescription>IPهای که در whitelist هستند و هرگز ban نمی‌شوند</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentIP && !currentIP.is_whitelisted && (
            <Button
              variant="outline"
              onClick={() => addCurrentIPMutation.mutate()}
              disabled={addCurrentIPMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              اضافه کردن IP فعلی ({currentIP.ip}) به Whitelist
            </Button>
          )}

          <Dialog open={addWhitelistDialog} onOpenChange={setAddWhitelistDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                اضافه کردن IP جدید به Whitelist
              </Button>
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
                <Button 
                  onClick={handleAddToWhitelist} 
                  disabled={addToWhitelistMutation.isPending}
                >
                  {addToWhitelistMutation.isPending ? 'در حال اضافه...' : 'اضافه کردن'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                    <Shield className="h-4 w-4 text-green-1" />
                    <span className="font-mono">{ip}</span>
                  {currentIP && currentIP.ip === ip && (
                    <Badge variant="default" className="text-xs">IP فعلی</Badge>
                  )}
                </div>
                {currentIP && currentIP.ip !== ip && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromWhitelist(ip)}
                    disabled={removeFromWhitelistMutation.isPending}
                    className="text-red-1 hover:text-red-2 hover:bg-red-1/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

