import { memo, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/core/utils/cn"
import { Card, CardHeader, CardTitle, CardContent } from "./Card"

interface CardWithIconProps {
  icon: LucideIcon
  title: ReactNode
  children: ReactNode
  iconBgColor?: string
  iconColor?: string
  borderColor?: string
  className?: string
  headerClassName?: string
  contentClassName?: string
  titleExtra?: ReactNode
}

const CardWithIcon = memo(function CardWithIcon({
  icon: Icon,
  title,
  children,
  iconBgColor = "bg-gray",
  iconColor = "stroke-gray-2",
  borderColor = "border-b-gray-1",
  className,
  headerClassName,
  contentClassName,
  titleExtra,
}: CardWithIconProps) {
  return (
    <Card className={cn("border-b-2", borderColor, className)}>
      <CardHeader className={cn("!pb-3", headerClassName)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-lg shadow-sm", iconBgColor)}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <span>{title}</span>
          </div>
          {titleExtra}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>
        {children}
      </CardContent>
    </Card >
  )
})

CardWithIcon.displayName = "CardWithIcon"

export { CardWithIcon }

