"use client";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Route, Wand2, LayoutDashboard, Loader2, Play, FileText, Clock, Shield, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";

export default function Page() {
  const { data: session, isPending } = useSession();
  const { role, isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRuns: 0,
    successfulRuns: 0,
    savedTemplates: 0,
    recentActivity: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?redirect=" + encodeURIComponent("/app"));
      return;
    }

    if (session?.user) {
      // Fetch user-specific stats
      fetchUserStats();
    }
  }, [session, isPending, router]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");

      // Fetch stats counters
      const statsRes = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });

      let statsData = { totalRuns: 0, successfulRuns: 0, savedTemplates: 0 };
      if (statsRes.ok) {
        statsData = await statsRes.json();
      }

      // Fetch recent runs
      const runsRes = await fetch("/api/runs?limit=5", {
        headers: { Authorization: `Bearer ${token}` }
      });

      let recentRuns = [];
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        // Handle array or { runs: [] } structure
        const runs = Array.isArray(runsData) ? runsData : (runsData.runs || []);
        recentRuns = runs; // already slice(0, 5) effectively by limit
      }

      setStats({
        totalRuns: statsData.totalRuns,
        successfulRuns: statsData.successfulRuns,
        savedTemplates: statsData.savedTemplates,
        recentActivity: recentRuns
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRun = async (runId: number) => {
    if (!confirm("Are you sure you want to delete this run?")) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/runs/${runId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Run deleted successfully");
        fetchUserStats(); // Refresh
      } else {
        toast.error("Failed to delete run");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred");
    }
  };

  if (isPending || !session || roleLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      {/* Welcome Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">
              Welcome back, {session.user.name}! 👋
            </h1>
            <p className="text-muted-foreground">
              Turn plain ideas into model-ready prompts with RouteX.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <Card className="mb-8 p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Admin Access Enabled
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You have unrestricted access to all features. Regular users will need to choose a plan to access premium features.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Runs</h3>
            <Play className="h-4 w-4 text-muted-foreground" />
          </div>
          {loading ? (
            <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          ) : (
            <p className="text-3xl font-bold">{stats.totalRuns}</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Successful</h3>
            <Route className="h-4 w-4 text-muted-foreground" />
          </div>
          {loading ? (
            <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          ) : (
            <p className="text-3xl font-bold">{stats.successfulRuns}</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Templates</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          {loading ? (
            <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          ) : (
            <p className="text-3xl font-bold">{stats.savedTemplates}</p>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <Card className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-1/2 animate-pulse bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : stats.recentActivity.length > 0 ? (
          <Card className="p-6">
            <div className="space-y-4">
              {stats.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Run #{activity.id}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {/* Use createdAt instead of created_at */}
                      {new Date(activity.createdAt).toLocaleDateString()} • {activity.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRun(activity.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/app/runs/${activity.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No activity yet. Start by creating your first run!</p>
            <Button asChild>
              <Link href="/app/playground">Go to Playground</Link>
            </Button>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-5">
            <h3 className="mb-1 font-medium">Playground</h3>
            <p className="text-muted-foreground mb-4 text-sm">Compile → Route → Execute</p>
            <Button asChild size="sm">
              <Link href="/app/playground">Open Playground</Link>
            </Button>
          </Card>
          <Card className="p-5">
            <h3 className="mb-1 font-medium">Wizard</h3>
            <p className="text-muted-foreground mb-4 text-sm">Intent to TaskSpec</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/app/wizard">Open Wizard</Link>
            </Button>
          </Card>
          <Card className="p-5">
            <h3 className="mb-1 font-medium">Templates</h3>
            <p className="text-muted-foreground mb-4 text-sm">Save & reuse TaskSpecs</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/app/templates">Browse</Link>
            </Button>
          </Card>
        </div>
      </section>
    </main>
  );
}