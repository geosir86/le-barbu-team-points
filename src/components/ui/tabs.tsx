import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md p-1 border shadow-sm",
      "!bg-[hsl(230_18%_12%)] !text-[hsl(220_15%_92%)] !border-[hsl(230_15%_18%)]",
      "dark:!bg-[hsl(230_18%_12%)] dark:!text-[hsl(220_15%_92%)] dark:!border-[hsl(230_15%_18%)]",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "!text-[hsl(220_10%_70%)]",
      "data-[state=active]:!bg-[hsl(230_15%_16%)] data-[state=active]:!text-[hsl(220_15%_85%)] data-[state=active]:shadow-sm",
      "hover:!bg-[hsl(230_15%_16%/0.5)] hover:!text-[hsl(220_15%_85%/0.8)]",
      "dark:!text-[hsl(220_10%_70%)]",
      "dark:data-[state=active]:!bg-[hsl(230_15%_16%)] dark:data-[state=active]:!text-[hsl(220_15%_85%)]",
      "dark:hover:!bg-[hsl(230_15%_16%/0.5)] dark:hover:!text-[hsl(220_15%_85%/0.8)]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
