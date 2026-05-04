"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Zap, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Run {
  id: string;
  task_family: string;
  goal: string;
  model: string;
  status: "success" | "failed" | "running";
  cost_usd: number;
  latency_ms: number;
  tokens_used: number;
  created_at: string;
  grade?: {
    passed: boolean;
    score: number;
  };
}

export default function Page() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/runs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch runs");

      const data = await response.json();
      setRuns(data.runs || []);
    } catch (error) {
      console.error("Error fetching runs:", error);
      toast.error("Failed to load run history");
    } finally {
      setLoading(false);
    }
  };

  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true;
    return run.status === filter;
  });

  const stats = {
    total: runs.length,
    success: runs.filter((r) => r.status === "success").length,
    failed: runs.filter((r) => r.status === "failed").length,
    avgCost: runs.length > 0 ? (runs.reduce((sum, r) => sum + r.cost_usd, 0) / runs.length).toFixed(4) : "0.00",
    avgLatency: runs.length > 0 ? Math.round(runs.reduce((sum, r) => sum + r.latency_ms, 0) / runs.length) : 0,
  };

  return (
    <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Run History</h1>
          <p className="text-muted-foreground mt-1">View and analyze all your task executions</p>
        </div>
        <Button onClick={fetchRuns} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Runs</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Zap className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Success</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Avg Cost</p>
              <p className="text-2xl font-bold">${stats.avgCost}</p>
            </div>
            <DollarSign className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Avg Latency</p>
              <p className="text-2xl font-bold">{stats.avgLatency}ms</p>
            </div>
            <Clock className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Runs ({stats.total})</TabsTrigger>
          <TabsTrigger value="success">Success ({stats.success})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Runs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading runs...</div>
        </div>
      ) : filteredRuns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            {filter === "all" ? "No runs yet. Start by using the Playground or Wizard." : `No ${filter} runs found.`}
          </div>
          <Button asChild variant="outline">
            <Link href="/app/playground">Go to Playground</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRuns.map((run) => (
            <Card key={run.id} className="p-6 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <Badge variant={run.task_family === "code" ? "default" : run.task_family === "write" ? "secondary" : "outline"}>
                      {run.task_family}
                    </Badge>
                    <Badge variant={run.status === "success" ? "default" : "destructive"}>
                      {run.status === "success" ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                      {run.status}
                    </Badge>
                    {run.grade && (
                      <Badge variant="outline">
                        Score: {run.grade.score}/5 {run.grade.passed ? "✓" : "✗"}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{run.goal}</h3>
                  <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                    <span>Model: {run.model}</span>
                    <span>•</span>
                    <span>${run.cost_usd.toFixed(4)}</span>
                    <span>•</span>
                    <span>{run.latency_ms}ms</span>
                    <span>•</span>
                    <span>{run.tokens_used.toLocaleString()} tokens</span>
                    <span>•</span>
                    <span>{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/app/runs/${run.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}