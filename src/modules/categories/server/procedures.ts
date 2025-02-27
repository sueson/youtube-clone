import { db } from "@/db";
import { categories } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";


// To get all categories
export const categoriesRouter = createTRPCRouter({
    // using base procedure, because it's going to be public to all users
    getMany: baseProcedure.query(async() => {
        const data = await db.select().from(categories);

        return data;
    })
})