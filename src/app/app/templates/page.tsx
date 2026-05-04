"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Copy, Trash2, Eye, FileText, Code, BarChart, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description: string;
  family: string;
  task_spec: any;
  usage_count: number;
  created_at: string;
}

const familyIcons: Record<string, any> = {
  write: FileText,
  code: Code,
  analyze: BarChart,
  plan: Lightbulb,
};

export default function Page() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/templates", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = (template: Template) => {
    localStorage.setItem("playground_template", JSON.stringify(template.task_spec));
    router.push("/app/playground");
    toast.success(`Loading template: ${template.name}`);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to delete template");

      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const viewDetails = (template: Template) => {
    setSelectedTemplate(template);
    setShowDetailDialog(true);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.family.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.family]) acc[template.family] = [];
    acc[template.family].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">Browse and reuse successful TaskSpecs</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <Input
            placeholder="Search templates by name, description, or task family..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      ) : Object.keys(groupedTemplates).length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? "No templates found matching your search." : "No templates yet. Complete tasks to save them as templates."}
          </div>
          <Button onClick={() => router.push("/app/playground")} variant="outline">
            Go to Playground
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([family, familyTemplates]) => {
            const Icon = familyIcons[family] || FileText;
            return (
              <div key={family}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold capitalize">{family}</h2>
                  <Badge variant="outline">{familyTemplates.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {familyTemplates.map((template) => (
                    <Card key={template.id} className="p-6 transition-all hover:shadow-md">
                      <div className="mb-4">
                        <h3 className="mb-2 font-semibold">{template.name}</h3>
                        <p className="text-muted-foreground mb-3 text-sm">{template.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {template.usage_count} uses
                          </Badge>
                          <span>•</span>
                          <span>{new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => useTemplate(template)} size="sm" className="flex-1">
                          <Copy className="mr-2 h-4 w-4" />
                          Use Template
                        </Button>
                        <Button onClick={() => viewDetails(template)} size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteTemplate(template.id)} size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Task Family</p>
                <Badge>{selectedTemplate.family}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Goal</p>
                <p className="text-sm">{selectedTemplate.task_spec.goal}</p>
              </div>
              {selectedTemplate.task_spec.context && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Context</p>
                  <p className="text-sm">{selectedTemplate.task_spec.context}</p>
                </div>
              )}
              {selectedTemplate.task_spec.acceptance_criteria && selectedTemplate.task_spec.acceptance_criteria.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm font-medium">Acceptance Criteria</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {selectedTemplate.task_spec.acceptance_criteria.map((criterion: string, idx: number) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">Full TaskSpec</p>
                <pre className="text-xs overflow-auto rounded-lg bg-muted p-4">{JSON.stringify(selectedTemplate.task_spec, null, 2)}</pre>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => useTemplate(selectedTemplate)} className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Use This Template
                </Button>
                <Button onClick={() => setShowDetailDialog(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}