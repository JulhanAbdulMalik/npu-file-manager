"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AppProgressBar as NProgress } from "next-nprogress-bar";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <NProgress
          height="2.5px"
          color="#a80063"
          options={{
            showSpinner: false,
            trickleSpeed: 200,
            minimum: 0.08,
            easing: "ease",
            speed: 400,
          }}
          shallowRouting
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
