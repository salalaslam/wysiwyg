"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $createHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  type ElementFormatType,
  type LexicalEditor,
} from "lexical";
import {
  Bot,
  Download,
  Eye,
  FileOutput,
  FileUp,
  LayoutTemplate,
  LoaderCircle,
  PenSquare,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  attachedResumeTemplateHtml,
  isStandaloneHtmlDocument,
  sanitizeImportedHtml,
} from "@/lib/html-templates";
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
  const documentTitle = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (documentTitle?.[1]) {
    return documentTitle[1].replace(/<[^>]+>/g, "").trim();
  }

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

function extractEditableHtml(html: string) {
  if (!isStandaloneHtmlDocument(html)) {
    return html;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  return document.body.innerHTML.trim();
}

function replaceStandaloneBodyHtml(documentHtml: string, bodyHtml: string) {
  if (!isStandaloneHtmlDocument(documentHtml)) {
    return bodyHtml;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(documentHtml, "text/html");
  document.body.innerHTML = bodyHtml;
  return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
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
  mode,
  onEdit,
  onExportDocx,
  onExportHtml,
  onPreview,
  onSetAlign,
  onToggleBold,
  onToggleBullet,
  onToggleHeading,
}: {
  disabled: boolean;
  mode: ViewMode;
  onEdit: () => void;
  onExportDocx: () => void;
  onExportHtml: () => void;
  onPreview: () => void;
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

const editorTheme = {
  text: {
    bold: "lexical-text-bold",
  },
};

function EditorHandlePlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    onReady(editor);
  }, [editor, onReady]);

  return null;
}

function LexicalDocumentEditor({
  value,
  onChange,
  onReady,
}: {
  value: string;
  onChange: (html: string) => void;
  onReady: (editor: LexicalEditor) => void;
}) {
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const lastSyncedHtmlRef = useRef("");
  const isApplyingExternalRef = useRef(false);

  const initialConfig = useMemo(
    () => ({
      namespace: "draftroom-lexical",
      theme: editorTheme,
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
      onError(error: Error) {
        throw error;
      },
    }),
    []
  );

  useEffect(() => {
    if (!editor || value === lastSyncedHtmlRef.current) {
      return;
    }

    isApplyingExternalRef.current = true;
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      if (value.trim()) {
        const parser = new DOMParser();
        const document = parser.parseFromString(value, "text/html");
        const nodes = $generateNodesFromDOM(editor, document);

        root.select();

        if (nodes.length > 0) {
          $insertNodes(nodes);
        }
      }

      if ($getRoot().getChildrenSize() === 0) {
        $getRoot().append($createParagraphNode());
      }
    });

    lastSyncedHtmlRef.current = value;
    queueMicrotask(() => {
      isApplyingExternalRef.current = false;
    });
  }, [editor, value]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorHandlePlugin
        onReady={(instance) => {
          setEditor(instance);
          onReady(instance);
        }}
      />
      <div className="relative min-h-[640px]">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-placeholder="Start drafting here or run a demo action from the chat pane."
              placeholder={<></>}
              className="lexical-editor min-h-[640px] px-8 py-8 text-[15px] leading-7 text-[#f6f1e8] focus:outline-none md:px-12 md:py-10"
            />
          }
          placeholder={
            <div className="lexical-placeholder px-8 py-8 text-[15px] text-[#718198] md:px-12 md:py-10">
              Start drafting here or run a demo action from the chat pane.
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          onChange={(editorState, instance) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(instance, null);
              lastSyncedHtmlRef.current = html;

              if (isApplyingExternalRef.current) {
                return;
              }

              onChange(html);
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}

export function LexicalWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [composer, setComposer] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isPending, startTransition] = useTransition();
  const [documentHtml, setDocumentHtml] = useState(initialDocumentHtml);
  const [editorHtml, setEditorHtml] = useState(initialDocumentHtml);
  const [title, setTitle] = useState("Prior Authorization Draft");
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isTemplateDocument = useMemo(() => isStandaloneHtmlDocument(documentHtml), [documentHtml]);

  const stats = useMemo(() => {
    const text = editorHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").length : 0;
    const chars = text.length;

    return { words, chars };
  }, [editorHtml]);

  const applyAssistantResult = useCallback((userText: string, assistantText: string, nextHtml: string) => {
    setMessages((current) => [
      ...current,
      createMessage("user", userText),
      createMessage("assistant", assistantText),
    ]);
    setDocumentHtml(nextHtml);
    setEditorHtml(nextHtml);
    setTitle(extractTitle(nextHtml));
    setViewMode("preview");
  }, []);

  const applyImportedTemplate = useCallback((html: string, userText: string, assistantText: string) => {
    const sanitizedHtml = sanitizeImportedHtml(html);
    const nextEditorHtml = extractEditableHtml(sanitizedHtml);

    setMessages((current) => [
      ...current,
      createMessage("user", userText),
      createMessage("assistant", assistantText),
    ]);
    setDocumentHtml(sanitizedHtml);
    setEditorHtml(nextEditorHtml);
    setTitle(extractTitle(sanitizedHtml));
    setViewMode("edit");
  }, []);

  const handlePromptSelect = (prompt: DemoPrompt) => {
    startTransition(() => {
      applyAssistantResult(prompt.intent, prompt.response, prompt.html);
    });
  };

  const handleLoadAttachedTemplate = () => {
    startTransition(() => {
      applyImportedTemplate(
        attachedResumeTemplateHtml,
        "Load the attached two-column HTML inside the editor.",
        "Loaded the two-column HTML into the Lexical workspace. The preview preserves the full document and the editor exposes the body content for inline rich-text editing."
      );
    });
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const html = await file.text();

    startTransition(() => {
      applyImportedTemplate(
        html,
        `Import HTML file: ${file.name}`,
        `Imported ${file.name} into the Lexical workspace.`
      );
    });

    event.target.value = "";
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

  const handleEditorChange = useCallback((nextEditorHtml: string) => {
    setEditorHtml(nextEditorHtml);
    setDocumentHtml((currentDocumentHtml) => {
      const nextDocumentHtml = isStandaloneHtmlDocument(currentDocumentHtml)
        ? replaceStandaloneBodyHtml(currentDocumentHtml, nextEditorHtml)
        : nextEditorHtml;

      setTitle(extractTitle(nextDocumentHtml));
      return nextDocumentHtml;
    });
  }, []);

  const handleExportHtml = () => {
    exportHtmlDocument(documentHtml, title);
  };

  const handleExportDocx = async () => {
    await exportDocxDocument(editorHtml, title);
  };

  const handleToggleHeading = () => {
    if (!editor) {
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      $setBlocksType(selection, () => $createHeadingNode("h1"));
    });
  };

  const handleToggleBold = () => {
    editor?.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const handleToggleBullet = () => {
    editor?.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const handleSetAlign = (align: "left" | "center" | "right") => {
    editor?.dispatchCommand(FORMAT_ELEMENT_COMMAND, align satisfies ElementFormatType);
  };

  return (
    <main className="grain-overlay min-h-screen overflow-hidden bg-transparent px-4 py-4 text-[#f6f1e8] md:px-6 md:py-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={(event) => {
          void handleImportFile(event);
        }}
      />
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
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-black/20 text-[#f6f1e8] hover:bg-white/8"
              )}
            >
              Open TipTap page
            </Link>
            <Badge variant="secondary" className="bg-white/6 text-[#d7deea]">Lexical editor</Badge>
            <Badge variant="secondary" className="bg-white/6 text-[#d7deea]">No auth</Badge>
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
                      Demo actions mutate the draft instantly so you can compare the same workflow with Lexical instead of TipTap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <Button
                  variant="outline"
                  className="justify-between border-white/10 bg-black/20 text-[#f6f1e8] hover:bg-white/8"
                  onClick={handleLoadAttachedTemplate}
                >
                  Load attached two-column HTML
                  <LayoutTemplate />
                </Button>
                <Button
                  variant="outline"
                  className="justify-between border-white/10 bg-black/20 text-[#f6f1e8] hover:bg-white/8"
                  onClick={handleOpenFilePicker}
                >
                  Import another HTML file
                  <FileUp />
                </Button>
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
                  onSetAlign={handleSetAlign}
                  onToggleBold={handleToggleBold}
                  onToggleBullet={handleToggleBullet}
                  onToggleHeading={handleToggleHeading}
                />
              </div>
              {isTemplateDocument ? (
                <p className="mt-3 text-sm text-[#95a3b6]">
                  Full HTML template loaded. Preview keeps the full document shell while Lexical edits the body content for a faster rich-text experience.
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
              <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#f5efe5] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.35)] md:p-4">
                <div className="rounded-[22px] bg-[linear-gradient(180deg,#1c2130_0%,#101520_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {viewMode === "preview" ? (
                    isTemplateDocument ? (
                      <iframe
                        title={title}
                        srcDoc={documentHtml}
                        className="h-[780px] w-full rounded-[22px] border-0 bg-white"
                      />
                    ) : (
                      <article
                        className="export-surface min-h-[680px] px-8 py-8 text-[15px] leading-7 text-[#f6f1e8] md:px-12 md:py-10"
                        dangerouslySetInnerHTML={{ __html: documentHtml }}
                      />
                    )
                  ) : (
                    <LexicalDocumentEditor value={editorHtml} onChange={handleEditorChange} onReady={setEditor} />
                  )}
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}