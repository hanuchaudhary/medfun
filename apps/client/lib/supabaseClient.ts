import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  // {
  //   realtime: {
  //     logger: (kind: any, msg: any, data: any) => {
  //       console.log(`${kind}: ${msg}`, data);
  //     },
  //   },
  // }
);
