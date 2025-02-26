"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";


export default function Home() {
    const [value, setValue] = useState("");
  return (
    <div className="text-rose-500">
        <Button
            onClick={() => setValue("Hello")} 
            variant="destructive">
            {value}, World!
        </Button>
    </div>
  );
}
