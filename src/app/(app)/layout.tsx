import { LiquefyProvider } from "@/lib/provider";
import { AppDock } from "./app-dock";

// Every main tab shares the dock; it stays put while the tabs change.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Liquid glass for the controls that float over the map.
    <LiquefyProvider theme="dark" tint="#4fe08a" intensity={1}>
      <div className="pb-28">{children}</div>
      <AppDock />
    </LiquefyProvider>
  );
}
