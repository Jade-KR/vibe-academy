import type { ComponentPropsWithoutRef } from "react";
import { slugify } from "@/shared/lib/legal";

type MDXComponentMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any>
>;

function getHeadingId(children: React.ReactNode): string | undefined {
  if (typeof children === "string") return slugify(children);
  return undefined;
}

export function getMDXComponents(): MDXComponentMap {
  return {
    h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
      <h1
        id={getHeadingId(children)}
        className="mb-4 mt-8 text-4xl font-bold tracking-tight text-foreground"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
      <h2
        id={getHeadingId(children)}
        className="mb-3 mt-8 text-3xl font-semibold tracking-tight text-foreground"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
      <h3
        id={getHeadingId(children)}
        className="mb-3 mt-6 text-2xl font-semibold text-foreground"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
      <h4
        id={getHeadingId(children)}
        className="mb-2 mt-4 text-xl font-semibold text-foreground"
        {...props}
      >
        {children}
      </h4>
    ),
    p: (props: ComponentPropsWithoutRef<"p">) => (
      <p className="mb-4 leading-7 text-muted-foreground" {...props} />
    ),
    a: (props: ComponentPropsWithoutRef<"a">) => (
      <a className="text-primary underline underline-offset-4 hover:text-primary/80" {...props} />
    ),
    code: (props: ComponentPropsWithoutRef<"code">) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props} />
    ),
    pre: (props: ComponentPropsWithoutRef<"pre">) => (
      <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4" {...props} />
    ),
    img: (props: ComponentPropsWithoutRef<"img">) => (
      <img className="my-6 rounded-lg" alt={props.alt || ""} {...props} />
    ),
    ul: (props: ComponentPropsWithoutRef<"ul">) => (
      <ul className="mb-4 ml-6 list-disc text-muted-foreground" {...props} />
    ),
    ol: (props: ComponentPropsWithoutRef<"ol">) => (
      <ol className="mb-4 ml-6 list-decimal text-muted-foreground" {...props} />
    ),
    li: (props: ComponentPropsWithoutRef<"li">) => <li className="mb-1" {...props} />,
    blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
      <blockquote
        className="mb-4 border-l-4 border-primary pl-4 italic text-muted-foreground"
        {...props}
      />
    ),
  };
}
