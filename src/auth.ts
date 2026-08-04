import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import prisma from "./lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const admin = await prisma.admin.findUnique({ where: { username } });
        if (admin) {
          const valid = await bcrypt.compare(password, admin.password);
          return valid ? { id: admin.id, name: admin.username, role: "admin" } : null;
        }

        const teacher = await prisma.teacher.findUnique({ where: { username } });
        if (teacher) {
          const valid = await bcrypt.compare(password, teacher.password);
          return valid
            ? { id: teacher.id, name: `${teacher.name} ${teacher.surname}`, role: "teacher" }
            : null;
        }

        const student = await prisma.student.findUnique({ where: { username } });
        if (student) {
          const valid = await bcrypt.compare(password, student.password);
          return valid
            ? { id: student.id, name: `${student.name} ${student.surname}`, role: "student" }
            : null;
        }

        const parent = await prisma.parent.findUnique({ where: { username } });
        if (parent) {
          const valid = await bcrypt.compare(password, parent.password);
          return valid
            ? { id: parent.id, name: `${parent.name} ${parent.surname}`, role: "parent" }
            : null;
        }

        return null;
      },
    }),
  ],
});
