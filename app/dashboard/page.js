"use client";
import TopBar from "@/components/top-bar";
import BottomNav from "@/components/nav";

export default function DashboardPage() {
  return (
    <>
      <TopBar />
      <main className="page" style={{ paddingTop: 16 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink2)", marginTop: 40, textAlign: "center" }}>
          Dashboard — coming next
        </div>
      </main>
      <BottomNav />
    </>
  );
}
