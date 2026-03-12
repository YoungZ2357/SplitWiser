import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ApiDocsPage() {
  const filePath = path.join(process.cwd(), "docs", "api.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <article className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow prose prose-sm sm:prose lg:prose-lg">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
