"use client";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";

export default function Page() {
  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink2)", marginTop: 40, textAlign: "center" }}>
          Milestones — coming soon
        </div>
      </main>
      <BottomNav />
    </>
  );
}
