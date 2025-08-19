import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      user_id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
