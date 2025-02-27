import { initTRPC } from "@trpc/server";
import { cache } from "react";


export const createTRPCContext = cache(async () => {
    // TODO: 
    return { userId: 'user123'}
});

const t = initTRPC.create({
    // TODO:
    // transform: superjson,
});
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;