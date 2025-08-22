import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getSession = () => getServerSession(authOptions);
