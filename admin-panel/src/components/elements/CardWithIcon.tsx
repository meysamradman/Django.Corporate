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
  cardBorderColor?: string
  className?: string
  headerClassName?: string
  contentClassName?: string
  titleExtra?: ReactNode
  showHeaderBorder?: boolean
  showCardBorder?: boolean
}

const CardWithIcon = memo(function CardWithIcon({
  icon: Icon,
  title,
  children,
  iconBgColor = "bg-gray",
  iconColor = "stroke-gray-2",
  borderColor = "border-br",
  cardBorderColor = "border-br",
  className,
  headerClassName,
  contentClassName,
  titleExtra,
  showHeaderBorder = true,
  showCardBorder = true,
}: CardWithIconProps) {
  return (
    <Card className={cn(
      showCardBorder && cn("border-b-2", cardBorderColor),
      className
    )}>
      <CardHeader className={cn(
        showHeaderBorder && cn("border-b pb-6", borderColor),
        headerClassName
      )}>
        <CardTitle className="flex items-center justify-between text-base leading-normal">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", iconBgColor)}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <span className="font-bold">{title}</span>
          </div>
          {titleExtra}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>
        {children}
      </CardContent>
    </Card>
  )
})

CardWithIcon.displayName = "CardWithIcon"

export { CardWithIcon }

