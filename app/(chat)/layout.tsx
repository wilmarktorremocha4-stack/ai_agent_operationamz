import { auth } from "@/app/(auth)/auth";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cookies } from "next/headers";
import { ChatShell } from "@/components/chat/shell";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <DataStreamProvider>
          <ActiveChatProvider>
            <AppSidebar user={session?.user} />
            <ChatShell>{children}</ChatShell>
          </ActiveChatProvider>
        </DataStreamProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}
