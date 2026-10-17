import { AppGlass } from "./app-glass";
import { TermsGuard } from "@/components/terms-guard";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ViewTransitionDock } from "@/components/view-transition-dock";
import { AppDock } from "./app-dock";

// Every main tab shares the dock; it stays put while the tabs change.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Liquid glass for the controls that float over the map.
    <AppGlass>
      <TermsGuard />
      <div className="pb-28">{children}</div>
      <PullToRefresh />
      <AppDock />
      <ViewTransitionDock />
    </AppGlass>
  );
}
