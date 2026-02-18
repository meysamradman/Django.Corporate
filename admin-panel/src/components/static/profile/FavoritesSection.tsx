import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { Button } from "@/components/elements/Button";
import { Calendar, Sparkles } from "lucide-react";
import { FAVORITE_ITEMS } from "@/components/static/profile/data";

export function FavoritesSection() {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="text-lg">علاقه‌مندی‌ها</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {FAVORITE_ITEMS.map((item) => (
            <article key={item.id} className="rounded-xl border border-br overflow-hidden bg-card">
              <div className="h-28 bg-gray" />
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-purple text-purple-2 text-xs font-semibold">
                      {item.author.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold text-font-p">{item.author}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-font-p text-sm leading-6">{item.title}</p>
                  <p className="text-xs text-font-s line-clamp-2">{item.subtitle}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-[11px] text-font-s">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5" />
                    {item.category}
                  </span>
                  <span>{item.tag}</span>
                </div>

                <Button size="sm" className="w-full">جزئیات بیشتر</Button>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
