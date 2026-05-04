export interface SeededTemplate {
    id: string;
    name: string;
    description: string;
    family: string;
    task_spec: any;
    usage_count: number;
    created_at: string;
    tags: string[];
}

export const SEEDED_TEMPLATES: SeededTemplate[] = [
    {
        id: "seed-1",
        name: "Cold Email Generator",
        description: "Generate professional cold outreach emails tailored to specific audiences.",
        family: "write",
        tags: ["marketing", "sales", "email"],
        usage_count: 1240,
        created_at: new Date().toISOString(),
        task_spec: {
            family: "write",
            goal: "Write a professional cold email to a potential client",
            context: "I am a sales representative for a SaaS company selling productivity software. The target is a CTO of a mid-sized tech company.",
            format: "text",
            audience: "CTO, Decision Maker",
            constraints: {
                length: "short",
                tone: "professional, concise"
            },
            acceptance_criteria: [
                "Include a clear value proposition",
                "Mention a specific pain point (team efficiency)",
                "Include a call to action for a demo"
            ]
        }
    },
    {
        id: "seed-2",
        name: "Python Data Analysis Script",
        description: "Create a Python script to analyze CSV data using pandas.",
        family: "code",
        tags: ["python", "pandas", "data-science"],
        usage_count: 850,
        created_at: new Date().toISOString(),
        task_spec: {
            family: "code",
            goal: "Write a Python script to load 'data.csv' and perform basic analysis",
            context: "The CSV contains columns: 'date', 'sales', 'region'. need to find total sales per region.",
            format: "code",
            audience: "Data Analyst",
            constraints: {
                tone: "factual"
            },
            acceptance_criteria: [
                "Use pandas library",
                "Handle missing values",
                "Print summary statistics",
                "Output sales by region"
            ]
        }
    },
    {
        id: "seed-3",
        name: "React Component - Card",
        description: "Generate a modern reusable Card component in React with Tailwind CSS.",
        family: "code",
        tags: ["react", "frontend", "typescript", "tailwind"],
        usage_count: 2100,
        created_at: new Date().toISOString(),
        task_spec: {
            family: "code",
            goal: "Create a React functional component for a Card UI element",
            context: "Using TypeScript and Tailwind CSS. The card should have an image slot, title, description, and action button.",
            format: "code",
            audience: "Frontend Developer",
            constraints: {
                tone: "technical"
            },
            acceptance_criteria: [
                "Use TypeScript interfaces",
                "Make it responsive",
                "Support custom className checks"
            ]
        }
    },
    {
        id: "seed-4",
        name: "Market Competitor Analysis",
        description: "Framework for analyzing competitors in a specific market segment.",
        family: "analyze",
        tags: ["business", "strategy", "research"],
        usage_count: 530,
        created_at: new Date().toISOString(),
        task_spec: {
            family: "analyze",
            goal: "Analyze the competitive landscape for a new coffee shop app",
            context: "Market is saturated with Starbucks and local independent apps. We offer subscription-based coffee.",
            format: "markdown",
            audience: "Product Manager",
            constraints: {
                length: "medium",
                tone: "analytical"
            },
            acceptance_criteria: [
                "Identify top 3 competitors",
                "SWOT analysis for the new app",
                "Pricing strategy recommendation"
            ]
        }
    },
    {
        id: "seed-5",
        name: "Debugging Assistant",
        description: "Systematic approach to debugging complex code issues.",
        family: "plan",
        tags: ["debug", "process", "guide"],
        usage_count: 320,
        created_at: new Date().toISOString(),
        task_spec: {
            family: "plan",
            goal: "Create a step-by-step debugging plan for a memory leak in a Node.js app",
            context: "Server crashes after 24 hours of uptime. Heap usage grows steadily.",
            format: "markdown",
            audience: "Backend Engineer",
            constraints: {
                length: "medium"
            },
            acceptance_criteria: [
                "Include tools to use (heapdump, chrome devtools)",
                "Step-by-step isolation strategy",
                "Common causes checklist"
            ]
        }
    }
];
