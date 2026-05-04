"use client";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowRight, FileText, Code, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function TemplatesSection() {
  return (
    <section id="templates" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-foreground text-balance text-3xl font-semibold md:text-5xl"
          >
            <span className="text-muted-foreground">
              Ready-to-Use
            </span>{" "}
            Templates
          </motion.h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-base leading-snug tracking-wide sm:text-lg">
            Start with proven TaskSpecs for common use cases. Customize and save your own.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="group h-full p-6 hover:shadow-lg transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Content Writing</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Blog posts, articles, and marketing copy with optimized prompts.
              </p>
              <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform" asChild>
                <Link href="/app/templates?category=write">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="group h-full p-6 hover:shadow-lg transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <Code className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Code Generation</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Functions, scripts, and code reviews with technical precision.
              </p>
              <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform" asChild>
                <Link href="/app/templates?category=code">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="group h-full p-6 hover:shadow-lg transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Mail className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Email Templates</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Professional emails, responses, and outreach campaigns.
              </p>
              <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform" asChild>
                <Link href="/app/templates?category=email">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="group h-full p-6 hover:shadow-lg transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <MessageSquare className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Analysis & Research</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Data analysis, summaries, and research reports.
              </p>
              <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform" asChild>
                <Link href="/app/templates?category=analyze">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/app/templates">
              View All Templates <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
