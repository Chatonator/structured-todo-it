
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cssVarRGB } from "@/utils/colors"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  categoryColor?: string;
}

function Badge({ className, variant, categoryColor, style, ...props }: BadgeProps) {
  // Si une couleur de catégorie est fournie, on l'utilise dans les styles inline
  const inlineStyle = React.useMemo(() => {
    if (categoryColor && variant === "outline") {
      const resolvedColor = cssVarRGB(categoryColor);
      return {
        backgroundColor: `${resolvedColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
        borderColor: resolvedColor,
        color: resolvedColor,
        ...style
      };
    }
    return style;
  }, [categoryColor, variant, style]);

  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      style={inlineStyle}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
