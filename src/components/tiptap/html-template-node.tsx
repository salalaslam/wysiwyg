"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

import { cn } from "@/lib/utils";

function HtmlTemplateView({ node, selected }: NodeViewProps) {
  const html = typeof node.attrs.html === "string" ? node.attrs.html : "";
  const title = typeof node.attrs.title === "string" ? node.attrs.title : "Imported HTML Template";

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
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#95a3b6]">Rendered inside TipTap</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#d7deea]">
            HTML template block
          </span>
        </div>
        <iframe
          title={title}
          srcDoc={html}
          className="h-[780px] w-full rounded-[18px] border border-white/10 bg-white"
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
