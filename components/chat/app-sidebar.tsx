"use client";

import {
  PanelLeftIcon,
  PenSquareIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { NavigatorAvatar } from "@/components/navigator-avatar";
import { SidebarHistory } from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Sidebar collapsible="icon">
        {/* ── Header: logo + collapse toggle ── */}
        <SidebarHeader className="px-3 py-3">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-2.5 group-data-[collapsible=icon]:hidden"
            >
              <NavigatorAvatar size={26} />
              <span className="font-semibold text-[14px] text-sidebar-foreground tracking-tight">
                AMZ Navigator
              </span>
            </Link>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="hidden group-data-[collapsible=icon]:flex items-center justify-center size-8 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  onClick={() => toggleSidebar()}
                  type="button"
                >
                  <PanelLeftIcon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">
                Open sidebar
              </TooltipContent>
            </Tooltip>

            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarTrigger className="size-7 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 gap-1">
          {/* ── New chat ── */}
          <button
            className="flex items-center gap-3 w-full rounded-xl px-3 h-10 text-[13.5px] font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:mx-auto"
            onClick={() => {
              setOpenMobile(false);
              router.push("/");
            }}
            type="button"
          >
            <PenSquareIcon className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">New chat</span>
          </button>

          {/* ── Search chats ── */}
          <div className="relative group-data-[collapsible=icon]:hidden">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/40 pointer-events-none" />
            <input
              className="w-full h-9 pl-8 pr-3 rounded-xl text-[13px] bg-sidebar-accent/40 text-sidebar-foreground placeholder:text-sidebar-foreground/35 border border-transparent focus:border-sidebar-border focus:bg-sidebar-accent/60 focus:outline-none transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              type="text"
              value={searchQuery}
            />
          </div>

          {/* ── Chat history ── */}
          <SidebarHistory user={user} searchQuery={searchQuery} />
        </SidebarContent>

        <SidebarFooter className="px-2 py-2 border-t border-sidebar-border/50">
          {user && <SidebarUserNav user={user} />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
