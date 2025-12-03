"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type WellnessMarkdownContentProps = {
  content: string;
  variant?: 'dietary' | 'exercise' | 'mental';
};

const variantStyles = {
  dietary: {
    headings: 'text-green-600 dark:text-green-400',
    strong: 'text-green-700 dark:text-green-300',
    links: 'text-green-600 dark:text-green-400',
    blockquote: 'border-green-500',
    code: 'bg-green-500/10 text-green-700 dark:text-green-300',
  },
  exercise: {
    headings: 'text-orange-600 dark:text-orange-400',
    strong: 'text-orange-700 dark:text-orange-300',
    links: 'text-orange-600 dark:text-orange-400',
    blockquote: 'border-orange-500',
    code: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  mental: {
    headings: 'text-purple-600 dark:text-purple-400',
    strong: 'text-purple-700 dark:text-purple-300',
    links: 'text-purple-600 dark:text-purple-400',
    blockquote: 'border-purple-500',
    code: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
};

export default function WellnessMarkdownContent({ content, variant = 'dietary' }: WellnessMarkdownContentProps) {
  const styles = variantStyles[variant];
  
  return (
    <div className={`
      prose prose-sm dark:prose-invert max-w-none
      prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-headings:${styles.headings}
      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
      prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:leading-relaxed prose-p:my-2
      prose-strong:font-semibold prose-strong:${styles.strong}
      prose-ul:my-2 prose-ul:pl-4 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-li:my-1
      prose-ol:my-2 prose-ol:pl-4
      prose-a:no-underline hover:prose-a:underline prose-a:${styles.links}
      prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:${styles.code}
      prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:${styles.blockquote}
      prose-hr:border-gray-300 dark:prose-hr:border-gray-600
      prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:p-2 prose-th:bg-gray-100 dark:prose-th:bg-gray-800
      prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:p-2
    `}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={`text-xl font-bold mt-4 mb-2 ${styles.headings}`}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-lg font-bold mt-4 mb-2 ${styles.headings}`}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-base font-semibold mt-3 mb-2 ${styles.headings}`}>{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className={`text-sm font-semibold mt-2 mb-1 ${styles.headings}`}>{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed my-2">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className={`font-semibold ${styles.strong}`}>{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="my-2 pl-4 space-y-1 list-disc list-inside">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-4 space-y-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-800 dark:text-gray-200">{children}</li>
          ),
          a: ({ href, children }) => (
            <a href={href} className={`${styles.links} hover:underline`} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 ${styles.blockquote} pl-4 italic my-3 text-gray-600 dark:text-gray-400`}>
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className={`px-1.5 py-0.5 rounded text-sm ${styles.code}`}>{children}</code>
          ),
          hr: () => (
            <hr className="my-4 border-gray-300 dark:border-gray-600" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 p-2">{children}</td>
          ),
        }}
      >
        {content || "Conteúdo não disponível."}
      </ReactMarkdown>
    </div>
  );
}
