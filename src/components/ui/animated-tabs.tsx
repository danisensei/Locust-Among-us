import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onChange, className }: AnimatedTabsProps) {
  return (
    <div className={cn("flex space-x-1 rounded-xl bg-muted/30 p-1 backdrop-blur-md border border-border/50 shadow-inner", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative rounded-lg px-4 py-1.5 text-xs font-medium transition-colors outline-none",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/50"
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-bubble"
                className="absolute inset-0 z-10 rounded-lg bg-background shadow-sm border border-border/50"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            <span className="relative z-20 flex items-center justify-center gap-1.5 tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
