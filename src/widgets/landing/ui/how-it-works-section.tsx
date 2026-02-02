"use client";

import { useTranslations } from "next-intl";

const STEPS = [0, 1, 2] as const;

export function HowItWorksSection() {
  const t = useTranslations("landing");

  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("howItWorks.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("howItWorks.subtitle")}</p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((stepIndex) => (
            <div key={stepIndex} className="flex flex-col items-center text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
                aria-label={`Step ${stepIndex + 1}`}
              >
                {stepIndex + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                {t(`howItWorks.steps.${stepIndex}.title`)}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {t(`howItWorks.steps.${stepIndex}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
