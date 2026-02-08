import { Input } from "@/components/elements/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Key, Edit, Trash2 } from "lucide-react";

interface AttributeCustomTableProps {
    customAttributes: [string, any][];
    editMode: boolean;
    handleAttributeChange: (key: string, value: any) => void;
    onEditKey: (key: string) => void;
    onDeleteClick: (key: string) => void;
}

export function AttributeCustomTable({
    customAttributes,
    editMode,
    handleAttributeChange,
    onEditKey,
    onDeleteClick
}: AttributeCustomTableProps) {
    return (
        <div className="border border-br overflow-hidden rounded-md bg-wt">
            <Table>
                <TableHeader>
                    <TableRow className="bg-table-header-bg border-b border-br hover:bg-table-header-bg">
                        <TableHead className="text-right font-bold text-font-p py-4 px-6">نام فیلد</TableHead>
                        <TableHead className="text-right font-bold text-font-p py-4 px-6">مقدار</TableHead>
                        {editMode && <TableHead className="w-[100px] text-center font-bold text-font-p py-4 px-6">عملیات</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customAttributes.map(([key, value]) => (
                        <TableRow key={key} className="hover:bg-purple-0/30 transition-colors border-b border-br last:border-b-0 group">
                            <TableCell className="text-right py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-0 flex items-center justify-center">
                                        <Key className="h-4 w-4 text-purple-1" />
                                    </div>
                                    <span className="font-semibold text-font-p">{key}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right py-4 px-6">
                                {editMode ? (
                                    <Input
                                        type="text"
                                        value={value ? String(value) : ""}
                                        onChange={(e) => handleAttributeChange(key, e.target.value)}
                                        placeholder="مقدار را وارد کنید"
                                        className="max-w-md bg-wt h-9 border-br focus:border-purple-1"
                                    />
                                ) : (
                                    <span className="text-font-p font-medium">
                                        {value ? String(value) : <span className="text-muted-foreground italic">خالی</span>}
                                    </span>
                                )}
                            </TableCell>
                            {editMode && (
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center justify-center">
                                        <DataTableRowActions
                                            row={{ original: { id: key } } as any}
                                            actions={[
                                                {
                                                    label: "ویرایش نام",
                                                    icon: <Edit className="h-4 w-4" />,
                                                    onClick: () => onEditKey(key),
                                                },
                                                {
                                                    label: "حذف",
                                                    icon: <Trash2 className="h-4 w-4" />,
                                                    onClick: () => onDeleteClick(key),
                                                    isDestructive: true,
                                                },
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
