"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles, Leaf, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const floatVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function HeroSection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 md:py-24">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative">
        <motion.div
          className="max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Discover unique treasures
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            {t("home.hero.title")}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-4 text-lg text-muted-foreground md:text-xl"
          >
            {t("home.hero.subtitle")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto group">
                {t("home.hero.cta")}
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </Link>
            <Link href="/signup?role=vendor">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Start Selling
              </Button>
            </Link>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap gap-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Sustainable</div>
                <div className="text-xs text-muted-foreground">Fashion</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Verified</div>
                <div className="text-xs text-muted-foreground">Sellers</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating decorative cards */}
        <div className="hidden lg:block absolute top-1/2 right-0 -translate-y-1/2 w-1/3">
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: -5 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-0 right-0 w-48 h-64 rounded-2xl bg-card shadow-xl border overflow-hidden"
            >
              <div className="h-3/4 bg-gradient-to-br from-primary/20 to-secondary/20" />
              <div className="p-3">
                <div className="h-3 w-3/4 bg-muted rounded" />
                <div className="h-2 w-1/2 bg-muted rounded mt-2" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 5 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute top-20 right-24 w-48 h-64 rounded-2xl bg-card shadow-xl border overflow-hidden"
            >
              <div className="h-3/4 bg-gradient-to-br from-secondary/30 to-primary/20" />
              <div className="p-3">
                <div className="h-3 w-2/3 bg-muted rounded" />
                <div className="h-2 w-1/3 bg-muted rounded mt-2" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function ValuePropositions() {
  const values = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      ),
      title: "Quality Verified",
      description: "Every item is checked and verified by our trusted sellers",
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: "Pay on Delivery",
      description: "Shop with confidence - pay when your order arrives",
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: "Sustainable Fashion",
      description: "Give items a second life and reduce fashion waste",
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`mx-auto w-14 h-14 rounded-2xl ${value.bg} flex items-center justify-center mb-4`}
              >
                <svg
                  className={`w-7 h-7 ${value.color}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {value.icon}
                </svg>
              </motion.div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {value.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
