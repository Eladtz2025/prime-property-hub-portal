import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Phone, MessageCircle } from "lucide-react";
import { BUSINESS_INFO } from "@/constants/business";

interface LuxuryArticleRendererProps {
  content: string;
  lang: "he" | "en";
}

type BlockType = "opening" | "highlight" | "cta" | "signature" | "markdown";

interface ContentBlock {
  type: BlockType;
  content: string;
}

const parseBlocks = (raw: string): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  const lines = raw.split("\n");
  let current: { type: BlockType; lines: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith(":::opening")) {
      current = { type: "opening", lines: [] };
      continue;
    }
    if (trimmed.startsWith(":::highlight")) {
      current = { type: "highlight", lines: [] };
      continue;
    }
    if (trimmed.startsWith(":::cta")) {
      current = { type: "cta", lines: [] };
      continue;
    }
    if (trimmed.startsWith(":::signature")) {
      current = { type: "signature", lines: [] };
      continue;
    }
    if (trimmed === ":::" && current) {
      blocks.push({ type: current.type, content: current.lines.join("\n").trim() });
      current = null;
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else {
      // Accumulate into markdown block
      const last = blocks[blocks.length - 1];
      if (last && last.type === "markdown") {
        last.content += "\n" + line;
      } else {
        blocks.push({ type: "markdown", content: line });
      }
    }
  }

  if (current) {
    blocks.push({ type: current.type, content: current.lines.join("\n").trim() });
  }

  return blocks.filter((b) => b.content.trim() !== "");
};

const OpeningBlock = ({ content }: { content: string }) => (
  <div className="mb-12 md:mb-16">
    <div className="text-lg md:text-xl text-muted-foreground leading-[1.9] font-montserrat">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  </div>
);

const HighlightBlock = ({ content, lang }: { content: string; lang: string }) => {
  const [copied, setCopied] = useState(false);
  const lines = content.split("\n");
  const title = lines[0]?.replace(/\*\*/g, "").trim();
  const body = lines.slice(1).join("\n").trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  return (
    <div className="my-12 md:my-16 bg-muted/40 border border-border/50 rounded-lg p-6 md:p-8 relative">
      {title && (
        <h3 className="text-lg font-semibold text-foreground font-playfair mb-4">{title}</h3>
      )}
      <p className="text-muted-foreground leading-relaxed font-montserrat text-sm md:text-base whitespace-pre-line">
        {body}
      </p>
      <button
        onClick={handleCopy}
        className="mt-4 inline-flex items-center gap-2 text-xs font-montserrat text-secondary hover:text-secondary/80 transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? (lang === "he" ? "הועתק!" : "Copied!") : (lang === "he" ? "העתק הודעה" : "Copy message")}
      </button>
    </div>
  );
};

const CtaBlock = ({ content, lang }: { content: string; lang: string }) => {
  const lines = content.split("\n");
  const title = lines[0]?.replace(/\*\*/g, "").trim();
  const body = lines.slice(1).join("\n").trim();

  const whatsappUrl = `https://wa.me/${BUSINESS_INFO.phone.replace(/-/g, "").replace(/^0/, "972")}?text=${encodeURIComponent(
    lang === "he" ? "היי, אשמח להתייעץ לגבי הנכס שלי" : "Hi, I'd like to consult about my property"
  )}`;
  const phoneUrl = `tel:${BUSINESS_INFO.phone}`;

  return (
    <div className="my-12 md:my-16 bg-foreground/5 rounded-xl p-8 md:p-12 text-center">
      {title && (
        <h3 className="text-2xl md:text-3xl font-playfair text-foreground mb-4">{title}</h3>
      )}
      {body && (
        <p className="text-muted-foreground font-montserrat mb-8 max-w-lg mx-auto">{body}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-montserrat text-sm hover:bg-secondary/90 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {lang === "he" ? "להתייעצות קצרה על הנכס" : "Quick property consultation"}
        </a>
        <a
          href={phoneUrl}
          className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-md font-montserrat text-sm hover:bg-muted/50 transition-colors"
        >
          <Phone className="w-4 h-4" />
          {lang === "he" ? "לשיחה אישית" : "Personal call"}
        </a>
      </div>
    </div>
  );
};

const SignatureBlock = ({ content }: { content: string }) => {
  const lines = content.split("\n").filter((l) => l.trim());
  return (
    <div className="mt-12 md:mt-16 pt-8 border-t border-border/30 text-center">
      {lines.map((line, i) => (
        <p
          key={i}
          className={
            i === 0
              ? "text-lg font-playfair text-foreground"
              : "text-sm text-muted-foreground font-montserrat mt-1"
          }
        >
          {line.trim()}
        </p>
      ))}
    </div>
  );
};

const MarkdownBlock = ({ content }: { content: string }) => (
  <div className="prose prose-lg max-w-none text-foreground font-montserrat
    prose-headings:font-playfair prose-headings:font-normal prose-headings:tracking-wide prose-headings:mt-12 prose-headings:mb-6
    prose-h2:text-2xl md:prose-h2:text-3xl
    prose-p:leading-[1.85] prose-p:mb-6 prose-p:text-muted-foreground
    prose-blockquote:border-secondary prose-blockquote:border-l-4 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-10 prose-blockquote:not-italic
    prose-blockquote:text-xl md:prose-blockquote:text-2xl prose-blockquote:font-playfair prose-blockquote:text-foreground/80 prose-blockquote:leading-relaxed
    prose-li:text-muted-foreground prose-li:leading-relaxed
    prose-ul:space-y-2
    prose-hr:my-10 prose-hr:border-border/30
    prose-strong:text-foreground prose-strong:font-semibold
  ">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);

const LuxuryArticleRenderer = ({ content, lang }: LuxuryArticleRendererProps) => {
  const blocks = parseBlocks(content);

  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "opening":
            return <OpeningBlock key={i} content={block.content} />;
          case "highlight":
            return <HighlightBlock key={i} content={block.content} lang={lang} />;
          case "cta":
            return <CtaBlock key={i} content={block.content} lang={lang} />;
          case "signature":
            return <SignatureBlock key={i} content={block.content} />;
          case "markdown":
            return <MarkdownBlock key={i} content={block.content} />;
        }
      })}
    </div>
  );
};

export default LuxuryArticleRenderer;
