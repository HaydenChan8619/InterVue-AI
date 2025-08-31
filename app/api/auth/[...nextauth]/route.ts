// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import type { NextAuthOptions } from "next-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!user?.email) {
          console.error("No email returned from provider — rejecting sign in");
          return false;
        }

        const provider = account?.provider ?? "google";
        const providerAccountId = account?.providerAccountId ?? null;

        const payload = {
          email: user.email,
          name: user.name ?? null,
          provider,
          provider_account_id: providerAccountId,
          last_active: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("users")
          .upsert(payload, { onConflict: "email" })
          .select()
          .single();

        if (error) {
          console.error("Supabase upsert error in signIn:", error);
        }

        return true;
      } catch (err) {
        console.error("signIn callback exception:", err);
        return false;
      }
    },

    async session({ session }) {
      try {
        if (!session?.user) return session;

        const email = session?.user?.email;
        if (!email) return session;

        const { data: dbUser, error } = await supabaseAdmin
          .from("users")
          .select("user_id, email, name, tokens_remaining")
          .eq("email", email)
          .maybeSingle();

        if (!error && dbUser) {
          (session.user as any).user_id = dbUser.user_id;
          session.user.name = dbUser.name ?? session.user.name;
          session.user.email = dbUser.email ?? session.user.email;
          (session.user as any).tokens_remaining = dbUser.tokens_remaining;
        } else if (error) {
          console.error("Supabase session lookup error:", error);
        }
      } catch (err) {
        console.error("session callback exception:", err);
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };