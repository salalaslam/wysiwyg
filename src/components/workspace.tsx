"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bot,
  Download,
  Eye,
  FileOutput,
  FileText,
  LoaderCircle,
  PenSquare,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  demoPrompts,
  initialDocumentHtml,
  initialMessages,
  type ChatMessage,
  type DemoPrompt,
} from "@/lib/demo-data";
import { exportDocxDocument, exportHtmlDocument } from "@/lib/exporters";
import { cn } from "@/lib/utils";

type ViewMode = "preview" | "edit";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${crypto.randomUUID()}`,
    role,
    content,
  };
}

function extractTitle(html: string) {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return match?.[1]?.replace(/<[^>]+>/g, "").trim() || "Draftroom Export";
}

function responseForCustomPrompt(input: string): { message: string; html: string } {
  const normalized = input.trim();

  return {
    message:
      "Simulated assistant action complete. I refreshed the document with a new section and a working plan for next edits.",
    html: `
      <h1>Working Draft</h1>
      <p><strong>Prompt received:</strong> ${normalized}</p>
      <p>
        This is a dummy action standing in for the future OpenRouter call. It updates the draft immediately so the interaction model,
        editing flow, and export pipeline can be reviewed now.
      </p>
      <h2>Recommended structure</h2>
      <ul>
        <li>Open with a concise purpose statement and patient or matter context.</li>
        <li>Summarize relevant facts, prior steps taken, and current constraints.</li>
        <li>Close with a direct requested action and a measurable rationale.</li>
      </ul>
      <h2>Suggested next revision</h2>
      <p>
        Tighten any passive language, confirm dates and identifiers, and add one section that names the intended outcome in plain terms.
      </p>
    `,
  };
}

function PromptPill({ prompt, onSelect }: { prompt: DemoPrompt; onSelect: (prompt: DemoPrompt) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-[#dd8c5b]/50 hover:bg-[#dd8c5b]/10"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#f7f0e7]">{prompt.label}</span>
        <Sparkles className="size-4 text-[#dd8c5b]" />
      </div>
      <p className="mt-1 text-xs leading-5 text-[#95a3b6]">{prompt.intent}</p>
    </button>
  );
}

function FormattingToolbar({
  disabled,
  onPreview,
  onEdit,
  mode,
  onExportHtml,
  onExportDocx,
  onSetAlign,
  onToggleBold,
  onToggleBullet,
  onToggleHeading,
}: {
  disabled: boolean;
  onPreview: () => void;
  onEdit: () => void;
  mode: ViewMode;
  onExportHtml: () => void;
  onExportDocx: () => void;
  onSetAlign: (align: "left" | "center" | "right") => void;
  onToggleBold: () => void;
  onToggleBullet: () => void;
  onToggleHeading: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
      <Button variant={mode === "preview" ? "default" : "ghost"} size="sm" onClick={onPreview}>
        <Eye />
        Preview
      </Button>
      <Button variant={mode === "edit" ? "default" : "ghost"} size="sm" onClick={onEdit}>
        <PenSquare />
        Edit
      </Button>
      <Separator orientation="vertical" className="mx-1 hidden h-7 bg-white/10 sm:block" />
      <Button variant="ghost" size="sm" onClick={onToggleHeading} disabled={disabled}>
        H1
      </Button>
      <Button variant="ghost" size="sm" onClick={onToggleBold} disabled={disabled}>
        Bold
      </Button>
      <Button variant="ghost" size="sm" onClick={onToggleBullet} disabled={disabled}>
        Bullets
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onSetAlign("left")} disabled={disabled}>
        Left
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onSetAlign("center")} disabled={disabled}>
        Center
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onSetAlign("right")} disabled={disabled}>
        Right
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExportHtml}>
          <FileOutput />
          Export HTML
        </Button>
        <Button size="sm" onClick={onExportDocx}>
          <Download />
          Export DOCX
        </Button>
      </div>
    </div>
  );
}

export function Workspace() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [composer, setComposer] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isPending, startTransition] = useTransition();
  const [documentHtml, setDocumentHtml] = useState(initialDocumentHtml);
  const [title, setTitle] = useState("Prior Authorization Draft");
  const [note, setNote] = useState("Internal note: no auth, no STT, demo-only actions.");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start drafting here or run a demo action from the chat pane.",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[640px] px-8 py-8 text-[15px] leading-7 text-[#f6f1e8] focus:outline-none md:px-12 md:py-10",
      },
    },
    content: initialDocumentHtml,
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      setDocumentHtml(html);
      setTitle(extractTitle(html));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    if (current !== documentHtml) {
      editor.commands.setContent(documentHtml, {
        emitUpdate: false,
      });
    }
  }, [documentHtml, editor]);

  const stats = useMemo(() => {
    const text = documentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").length : 0;
    const chars = text.length;

    return { words, chars };
  }, [documentHtml]);

  const applyAssistantResult = (userText: string, assistantText: string, nextHtml: string) => {
    setMessages((current) => [
      ...current,
      createMessage("user", userText),
      createMessage("assistant", assistantText),
    ]);
    setDocumentHtml(nextHtml);
    setViewMode("preview");
  };

  const handlePromptSelect = (prompt: DemoPrompt) => {
    startTransition(() => {
      applyAssistantResult(prompt.intent, prompt.response, prompt.html);
    });
  };

  const handleSubmit = () => {
    const nextValue = composer.trim();
    if (!nextValue) {
      return;
    }

    setComposer("");

    startTransition(() => {
      const result = responseForCustomPrompt(nextValue);
      applyAssistantResult(nextValue, result.message, result.html);
    });
  };

  const handleExportHtml = () => {
    exportHtmlDocument(documentHtml, title);
  };

  const handleExportDocx = async () => {
    await exportDocxDocument(documentHtml, title);
  };

  return (
    <main className="grain-overlay min-h-screen overflow-hidden bg-transparent px-4 py-4 text-[#f6f1e8] md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#090d15]/90 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur md:min-h-[calc(100vh-3rem)]">
        <header className="flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-4 md:px-6">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#dd8c5b]/35 bg-[#dd8c5b]/10 text-[#ffd8bf]">
                POC
              </Badge>
              <span className="text-xs uppercase tracking-[0.3em] text-[#95a3b6]">Draftroom</span>
            </div>
            <h1 className="mt-2 font-heading text-3xl text-[#fff8ef] md:text-4xl">Chat-guided document drafting</h1>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-white/6 text-[#d7deea]">No auth</Badge>
            <Badge variant="secondary" className="bg-white/6 text-[#d7deea]">No speech-to-text</Badge>
            <Badge variant="secondary" className="bg-white/6 text-[#d7deea]">OpenRouter-ready later</Badge>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="panel-shell flex min-h-0 flex-col border-b border-white/10 md:border-r md:border-b-0">
            <div className="px-5 py-5 md:px-6">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-[#dd8c5b]/12 p-2 text-[#dd8c5b]">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#fff8ef]">Simulated assistant</p>
                    <p className="mt-1 text-sm leading-6 text-[#95a3b6]">
                      Demo actions mutate the draft instantly so you can evaluate the workflow before wiring in a real model provider.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {demoPrompts.map((prompt) => (
                  <PromptPill key={prompt.id} prompt={prompt} onSelect={handlePromptSelect} />
                ))}
              </div>
            </div>

            <Separator className="bg-white/8" />

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5 md:px-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                    message.role === "assistant"
                      ? "bg-white/6 text-[#f3eee6]"
                      : "ml-auto bg-[#dd8c5b] text-[#1a130d]"
                  )}
                >
                  {message.content}
                </div>
              ))}
              {isPending ? (
                <div className="flex max-w-[92%] items-center gap-2 rounded-3xl bg-white/6 px-4 py-3 text-sm text-[#d7deea]">
                  <LoaderCircle className="size-4 animate-spin" />
                  Running demo action...
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/10 px-5 py-4 md:px-6">
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-[#95a3b6]">Instruction</label>
              <Textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                className="min-h-28 resize-none border-white/10 bg-black/20 text-[#f7f0e7] placeholder:text-[#718198]"
                placeholder="Example: tighten this letter for a payer medical reviewer and add a more direct recommendation."
              />
              <div className="mt-3 flex items-center gap-3">
                <Button className="bg-[#dd8c5b] text-[#1a130d] hover:bg-[#e59a6c]" onClick={handleSubmit} disabled={isPending}>
                  <SendHorizonal />
                  Run dummy action
                </Button>
                <span className="text-xs text-[#95a3b6]">Future OpenRouter call slot</span>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(13,18,30,0.74),rgba(10,13,20,0.9))]">
            <div className="border-b border-white/10 px-5 py-5 md:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-[#95a3b6]">Document title</label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-11 border-white/10 bg-black/20 text-base text-[#fff8ef] placeholder:text-[#718198]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 xl:w-[360px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#95a3b6]">Words</p>
                    <p className="mt-2 text-xl font-semibold text-[#fff8ef]">{stats.words}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#95a3b6]">Chars</p>
                    <p className="mt-2 text-xl font-semibold text-[#fff8ef]">{stats.chars}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#95a3b6]">Mode</p>
                    <p className="mt-2 text-xl font-semibold capitalize text-[#fff8ef]">{viewMode}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <FormattingToolbar
                  disabled={!editor}
                  mode={viewMode}
                  onPreview={() => setViewMode("preview")}
                  onEdit={() => setViewMode("edit")}
                  onExportHtml={handleExportHtml}
                  onExportDocx={() => {
                    void handleExportDocx();
                  }}
                  onSetAlign={(align) => editor?.chain().focus().setTextAlign(align).run()}
                  onToggleBold={() => editor?.chain().focus().toggleBold().run()}
                  onToggleBullet={() => editor?.chain().focus().toggleBulletList().run()}
                  onToggleHeading={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-h-0 overflow-y-auto p-5 md:p-6">
                <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#f5efe5] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.35)] md:p-4">
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#1c2130_0%,#101520_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {viewMode === "preview" ? (
                      <article
                        className="export-surface min-h-[680px] px-8 py-8 text-[15px] leading-7 text-[#f6f1e8] md:px-12 md:py-10"
                        dangerouslySetInnerHTML={{ __html: documentHtml }}
                      />
                    ) : (
                      <EditorContent editor={editor} />
                    )}
                  </div>
                </div>
              </div>

              <aside className="border-t border-white/10 p-5 xl:border-t-0 xl:border-l xl:p-6">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-[#fff8ef]">
                    <FileText className="size-4 text-[#dd8c5b]" />
                    <h2 className="text-sm font-medium">Workspace notes</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#95a3b6]">
                    Keep a small operational note here while the document remains editable on the main canvas.
                  </p>
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="mt-4 min-h-36 resize-none border-white/10 bg-black/20 text-[#f6f1e8]"
                  />
                </div>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#fff8ef]">Export targets</p>
                      <p className="mt-1 text-sm text-[#95a3b6]">HTML for browser review, DOCX for editable handoff.</p>
                    </div>
                    <Download className="size-4 text-[#dd8c5b]" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    <Button variant="outline" className="justify-between border-white/10 bg-black/20 text-[#f6f1e8]" onClick={handleExportHtml}>
                      Export current draft as HTML
                      <FileOutput />
                    </Button>
                    <Button className="justify-between bg-[#dd8c5b] text-[#1a130d] hover:bg-[#e59a6c]" onClick={() => void handleExportDocx()}>
                      Export current draft as DOCX
                      <Download />
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
