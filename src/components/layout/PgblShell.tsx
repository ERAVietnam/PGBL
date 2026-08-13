import type { ReactNode } from "react";

type PgblShellProps = {
  children: ReactNode;
};

export function PgblShell({ children }: PgblShellProps) {
  return <main>{children}</main>;
}
