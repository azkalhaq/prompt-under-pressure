import ChatHelp from "@/components/ChatHelp";
import ChatInput from "@/components/ChatInput";


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-2">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-5 px-4 w-full">
        <h2 className="text-xl md:text-3xl font-semibold">What can I Help with?</h2>
        
        <ChatInput />
      </div>
    </main>
  );
}
