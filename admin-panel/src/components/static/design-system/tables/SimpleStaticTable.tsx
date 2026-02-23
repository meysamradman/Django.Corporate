import { Card, CardContent } from "@/components/elements/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";

const rows = [
  { title: "آپارتمان الهیه", status: "منتشر شده", date: "2026-02-20" },
  { title: "ویلای لواسان", status: "پیش‌نویس", date: "2026-02-18" },
  { title: "پنت‌هاوس زعفرانیه", status: "منتشر شده", date: "2026-02-15" },
];

export function SimpleStaticTable() {
  return (
    <Card className="max-w-4xl shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان ملک</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>تاریخ ثبت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.title}>
                <TableCell className="text-font-p">{row.title}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
