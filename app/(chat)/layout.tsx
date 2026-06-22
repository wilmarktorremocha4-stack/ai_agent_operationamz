import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value === "false";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <DataStreamProvider>
        <ActiveChatProvider>
          <AppSidebar user={session?.user} />
          <SidebarInset>
            {children}
          </SidebarInset>
          <Toaster position="top-center" richColors />
        </ActiveChatProvider>
      </DataStreamProvider>
    </SidebarProvider>
  );
}
