import Image from "next/image";


export default function Home() {
  return (
    <div className="flex items-center gap-3 p-3">
        <Image 
            src={"/logo.svg"}
            alt="logo"
            width={50}
            height={50}
        />
        <p className="text-lg font-bold tracking-tight">
            Youtube
        </p>
    </div>
  );
}
