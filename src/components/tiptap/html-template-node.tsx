"use client";

import { useCallback, useEffect, useRef } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

import { cn } from "@/lib/utils";

function serializeIframeDocument(document: Document) {
  const doctype = document.doctype;
  const doctypeString = doctype
    ? `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ""}${doctype.systemId ? ` \"${doctype.systemId}\"` : ""}>`
    : "<!DOCTYPE html>";

  return `${doctypeString}\n${document.documentElement.outerHTML}`;
}

function extractDocumentTitle(document: Document, fallbackTitle: string) {
  const documentTitle = document.title.trim();
  if (documentTitle) {
    return documentTitle;
  }

  const firstHeading = document.body.querySelector("h1")?.textContent?.trim();
  return firstHeading || fallbackTitle;
}

function HtmlTemplateView({ node, selected, updateAttributes }: NodeViewProps) {
  const html = typeof node.attrs.html === "string" ? node.attrs.html : "";
  const title = typeof node.attrs.title === "string" ? node.attrs.title : "Imported HTML Template";
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const latestHtmlRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const clearScheduledSync = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  const resizeIframe = useCallback((document: Document) => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      780
    );

    iframe.style.height = `${documentHeight + 8}px`;
  }, []);

  const commitIframeChanges = useCallback(
    (document: Document) => {
      const nextHtml = serializeIframeDocument(document);
      latestHtmlRef.current = nextHtml;

      updateAttributes({
        html: nextHtml,
        title: extractDocumentTitle(document, title),
      });

      resizeIframe(document);
    },
    [resizeIframe, title, updateAttributes]
  );

  const scheduleIframeSync = useCallback(
    (document: Document) => {
      clearScheduledSync();
      syncTimeoutRef.current = window.setTimeout(() => {
        commitIframeChanges(document);
      }, 120);
    },
    [clearScheduledSync, commitIframeChanges]
  );

  const enableDocumentEditing = useCallback((document: Document) => {
    document.designMode = "on";

    if (document.body) {
      document.body.contentEditable = "true";
      document.body.spellcheck = false;
      document.body.style.caretColor = "#111111";
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    let detachListeners: (() => void) | null = null;

    const cleanupDocumentState = () => {
      detachListeners?.();
      detachListeners = null;
      observerRef.current?.disconnect();
      observerRef.current = null;
      clearScheduledSync();
    };

    const bindEditableDocument = () => {
      const document = iframe.contentDocument;
      if (!document) {
        return;
      }

      cleanupDocumentState();
      enableDocumentEditing(document);
      latestHtmlRef.current = serializeIframeDocument(document);
      resizeIframe(document);

      const handleInput = () => {
        scheduleIframeSync(document);
      };

      document.addEventListener("input", handleInput);
      document.addEventListener("keyup", handleInput);
      document.addEventListener("paste", handleInput);
      document.addEventListener("cut", handleInput);

      observerRef.current = new MutationObserver(() => {
        resizeIframe(document);
      });
      observerRef.current.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });

      detachListeners = () => {
        document.removeEventListener("input", handleInput);
        document.removeEventListener("keyup", handleInput);
        document.removeEventListener("paste", handleInput);
        document.removeEventListener("cut", handleInput);
      };
    };

    const handleLoad = () => {
      bindEditableDocument();
    };

    iframe.addEventListener("load", handleLoad);

    if (latestHtmlRef.current !== html) {
      iframe.srcdoc = html;
      latestHtmlRef.current = html;
    } else if (iframe.contentDocument?.documentElement) {
      bindEditableDocument();
    }

    return () => {
      iframe.removeEventListener("load", handleLoad);
      cleanupDocumentState();
    };
  }, [clearScheduledSync, enableDocumentEditing, html, resizeIframe, scheduleIframeSync]);

  return (
    <NodeViewWrapper
      className={cn(
        "not-prose rounded-[24px] border border-white/10 bg-[#0f1522] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        selected && "ring-2 ring-[#dd8c5b]/60"
      )}
    >
      <div contentEditable={false} className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#fff8ef]">{title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#95a3b6]">Editable inside TipTap</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#d7deea]">
            HTML template block
          </span>
        </div>
        <iframe
          ref={iframeRef}
          title={title}
          className="min-h-[780px] w-full rounded-[18px] border border-white/10 bg-white"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const HtmlTemplateNode = Node.create({
  name: "htmlTemplate",
  group: "block",
  atom: true,
  isolating: true,
  selectable: true,

  addAttributes() {
    return {
      html: {
        default: "",
      },
      title: {
        default: "Imported HTML Template",
      },
    };
  },

  parseHTML() {
    return [{ tag: "html-template" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["html-template", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlTemplateView);
  },
});
