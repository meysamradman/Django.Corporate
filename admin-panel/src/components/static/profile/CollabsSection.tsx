import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { COLLAB_ITEMS } from "@/components/static/profile/data";

export function CollabsSection() {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="text-lg">همکاری‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {COLLAB_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-br p-3 bg-card">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                <Avatar className="size-8 border border-br bg-card">
                  <AvatarFallback className="bg-blue text-blue-2 text-xs">A</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border border-br bg-card">
                  <AvatarFallback className="bg-orange text-orange-2 text-xs">J</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border border-br bg-card">
                  <AvatarFallback className="bg-purple text-purple-2 text-xs">C</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="text-sm font-semibold text-font-p">{item.title}</p>
                <p className="text-xs text-font-s">{item.members}</p>
              </div>
            </div>

            <Button size="sm">افزودن عضو</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
