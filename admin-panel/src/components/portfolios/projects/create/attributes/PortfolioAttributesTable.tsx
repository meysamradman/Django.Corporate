import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Key, Plus, Edit, Trash2, Settings } from "lucide-react";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";

interface PortfolioAttributesTableProps {
    currentAttributes: Record<string, any>;
    editMode: boolean;
    onOpenDialog: (key?: string) => void;
    onDeleteClick: (key: string) => void;
    onValueChange: (key: string, value: string) => void;
}

export function PortfolioAttributesTable({
    currentAttributes,
    editMode,
    onOpenDialog,
    onDeleteClick,
    onValueChange
}: PortfolioAttributesTableProps) {
    if (Object.keys(currentAttributes).length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-0 mb-4">
                    <Settings className="h-8 w-8 text-purple-1" />
                </div>
                <p className="text-font-m mb-2">فیلد اضافی ثبت نشده است</p>
                <p className="text-font-s/60 mb-4">برای شروع، فیلد جدید اضافه کنید</p>
                {editMode && (
                    <Button onClick={() => onOpenDialog()} variant="outline" size="sm">
                        <Plus className="h-4 w-4 ml-2" />
                        افزودن اولین فیلد
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="border border-br overflow-hidden bg-wt">
            <Table>
                <TableHeader>
                    <TableRow className="bg-table-header-bg border-b border-br hover:bg-table-header-bg">
                        <TableHead className="text-right font-semibold text-font-p">نام فیلد</TableHead>
                        <TableHead className="text-right font-semibold text-font-p">مقدار</TableHead>
                        {editMode && (
                            <TableHead className="w-[80px] text-center font-semibold text-font-p">عملیات</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(currentAttributes).map(([key, value]) => (
                        <TableRow
                            key={key}
                            className="hover:bg-purple-0/50 transition-colors border-b border-br last:border-b-0 group"
                        >
                            <TableCell className="text-right py-4">
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0 w-10 h-10 bg-purple-0 flex items-center justify-center">
                                        <Key className="h-5 w-5 text-purple-1" />
                                    </div>
                                    <span className="font-semibold text-font-p text-font-m">{key}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right py-4">
                                {editMode ? (
                                    <Input
                                        type="text"
                                        value={value ? String(value) : ""}
                                        onChange={(e) => onValueChange(key, e.target.value)}
                                        placeholder="مقدار را وارد کنید"
                                        className="max-w-md bg-wt"
                                    />
                                ) : (
                                    <span className="text-font-s">
                                        {value ? String(value) : <span className="opacity-60 italic">خالی</span>}
                                    </span>
                                )}
                            </TableCell>
                            {editMode && (
                                <TableCell className="py-4">
                                    <div className="flex items-center justify-center">
                                        <DataTableRowActions
                                            row={{ original: { id: key } } as any}
                                            actions={[
                                                { label: "ویرایش", icon: <Edit className="h-4 w-4" />, onClick: () => onOpenDialog(key) },
                                                { label: "حذف", icon: <Trash2 className="h-4 w-4" />, onClick: () => onDeleteClick(key), isDestructive: true },
                                            ]}
                                        />
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
