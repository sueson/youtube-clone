// video-categories

import { db } from "@/db";
import { categories } from "@/db/schema";

// This script will used to insert all the values into the database with the help of bun - bun easily runs typescript scripts with ES6 imports, node uses require
const categoryNames = [
    "Science and Technology",
    "Comedy",
    "News",
    "Cars and Vehicles",
    "Gaming",
    "Entertainment",
    "Blogs",
    "Films and animations",
    "Music",
    "Sports",
    "Travel",
    "Fashion and Style",
    "Gym"
];

async function main() {
    console.log("Seeding Categories");

    try {
        const values = categoryNames.map((name) => ({
            name,
            description: `Videos related to ${name.toLowerCase()}`,
        }));

        await db.insert(categories).values(values);

        console.log("Categories seeded successfully");
    } catch (error) {
        console.log("Error seeding categories", error);
        // This line stops the program and returns an error code (1) to indicate that something went wrong while trying to seed categories.
        process.exit(1);
    }
}

main();