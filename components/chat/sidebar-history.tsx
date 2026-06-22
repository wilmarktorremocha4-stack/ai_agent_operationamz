"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { ChatItem } from "./sidebar-history-item";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?limit=${PAGE_SIZE}`;
  }

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) {
    return null;
  }

  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

function DateLabel({ label }: { label: string }) {
  return (
    <div className="px-2 pt-3 pb-1 text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider select-none">
      {label}
    </div>
  );
}

export function SidebarHistory({
  user,
  searchQuery = "",
}: {
  user: User | undefined;
  searchQuery?: string;
}) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    user ? getChatHistoryPaginationKey : () => null,
    fetcher,
    { fallbackData: [], revalidateOnFocus: false }
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRename = (chatId: string, title: string) => {
    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.map((chat) =>
            chat.id === chatId ? { ...chat, title } : chat
          ),
        }));
      }
    }, { revalidate: false });

    fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );

    toast.success("Chat renamed");
  };

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const handleDelete = () => {
    const chatToDelete = deleteId;
    const isCurrentChat = pathname === `/chat/${chatToDelete}`;

    setShowDeleteDialog(false);

    if (isCurrentChat) {
      router.replace("/");
    }

    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.filter((chat) => chat.id !== chatToDelete),
        }));
      }
    });

    fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatToDelete}`,
      { method: "DELETE" }
    );

    toast.success("Chat deleted");
  };

  if (!user) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-2">
        <SidebarGroupContent>
          <p className="text-[12.5px] text-sidebar-foreground/40 text-center px-3 py-4">
            Sign in to save your chats
          </p>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-2">
        <div className="flex flex-col gap-0.5 px-1">
          {[60, 40, 75, 35, 55].map((w) => (
            <div className="flex h-9 items-center px-2" key={w}>
              <div
                className="h-3 animate-pulse rounded-full bg-sidebar-foreground/[0.07]"
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </SidebarGroup>
    );
  }

  const allChats = (paginatedChatHistories ?? []).flatMap((p) => p.chats);

  const filtered = searchQuery.trim()
    ? allChats.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allChats;

  const hasEmptyChatHistory = allChats.length === 0;

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-2">
        <SidebarGroupContent>
          <p className="text-[12.5px] text-sidebar-foreground/40 text-center px-3 py-4">
            Your conversations will appear here
          </p>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const renderChatItem = (chat: Chat) => (
    <ChatItem
      chat={chat}
      isActive={chat.id === id}
      key={chat.id}
      onDelete={(chatId) => {
        setDeleteId(chatId);
        setShowDeleteDialog(true);
      }}
      onRename={handleRename}
      setOpenMobile={setOpenMobile}
    />
  );

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden pt-0">
        <SidebarGroupContent>
          <SidebarMenu>
            {searchQuery.trim() ? (
              // ── Search results (flat list) ──
              <div>
                <DateLabel label={`Results for "${searchQuery}"`} />
                {filtered.length === 0 ? (
                  <p className="text-[12.5px] text-sidebar-foreground/40 px-3 py-2">
                    No chats found
                  </p>
                ) : (
                  filtered.map(renderChatItem)
                )}
              </div>
            ) : (
              // ── Date-grouped list ──
              (() => {
                const grouped = groupChatsByDate(filtered);
                return (
                  <div>
                    {grouped.today.length > 0 && (
                      <div>
                        <DateLabel label="Today" />
                        {grouped.today.map(renderChatItem)}
                      </div>
                    )}
                    {grouped.yesterday.length > 0 && (
                      <div>
                        <DateLabel label="Yesterday" />
                        {grouped.yesterday.map(renderChatItem)}
                      </div>
                    )}
                    {grouped.lastWeek.length > 0 && (
                      <div>
                        <DateLabel label="Previous 7 days" />
                        {grouped.lastWeek.map(renderChatItem)}
                      </div>
                    )}
                    {grouped.lastMonth.length > 0 && (
                      <div>
                        <DateLabel label="Previous 30 days" />
                        {grouped.lastMonth.map(renderChatItem)}
                      </div>
                    )}
                    {grouped.older.length > 0 && (
                      <div>
                        <DateLabel label="Older" />
                        {grouped.older.map(renderChatItem)}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {!hasReachedEnd && (
            <div className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground/30">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <span className="text-[11px]">Loading more…</span>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
