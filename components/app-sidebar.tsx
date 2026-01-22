// components/AppSidebar.tsx
"use client"

import * as React from "react"
import { LayoutDashboard, List, PlusCircle, Router } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const EXPANDED_WIDTH = "18rem"
const COLLAPSED_WIDTH = "5rem"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Register Device", url: "/register-meter", icon: PlusCircle },
  { title: "Meter List", url: "/meterlist", icon: List },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="icon"
      style={{
        "--sidebar-width": EXPANDED_WIDTH,
        "--sidebar-width-icon": COLLAPSED_WIDTH,
      } as React.CSSProperties}
      {...props}
    >
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3 min-h-[2.5rem] relative">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <Router className="h-6 w-6" />
          </div>

          <div
            className={cn(
              "flex flex-col transition-all duration-300 ease-in-out",
              "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-20"
            )}
          >
            <div className="flex items-baseline gap-1 text-xl uppercase font-semibold whitespace-nowrap">
              Indirex
              <span className="text-sm lowercase text-primary">[router]</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className={cn(
                  // Expanded mode: default left alignment + some padding (shadcn standard)
                  "justify-start px-3",

                  // Collapsed mode: center the icon horizontally
                  "group-data-[collapsible=icon]:justify-center",
                  "group-data-[collapsible=icon]:px-0",           // remove side padding so centering is true middle

                  // Make icons larger & consistent when collapsed
                  "group-data-[collapsible=icon]:[&_svg]:h-6",
                  "group-data-[collapsible=icon]:[&_svg]:w-6",
                  "group-data-[collapsible=icon]:[&_svg]:shrink-0",

                  // Optional: subtle hover/active states in collapsed view
                  "group-data-[collapsible=icon]:hover:bg-accent/50",
                  "group-data-[collapsible=icon]:data-[active=true]:bg-accent/70",
                  "ml-5 mt-3"
                )}
              >
                <Link href={item.url} className="flex w-full items-center">
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarRail
        className={cn(
          "opacity-100 hover:opacity-100 transition-opacity",
          "group-data-[collapsible=icon]:hidden"  // ← hide completely in collapsed mode
        )}
      />
      </Sidebar>
  )
}