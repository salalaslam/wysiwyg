"use client";

import dynamic from "next/dynamic";

import { DocumentEditorWorkspace } from "@/components/document-editor-workspace";
import type { EditorSurfaceProps } from "@/components/document-editor-workspace";

const TinymceEditorSurface = dynamic<EditorSurfaceProps>(
  () => import("@/components/tinymce-editor-surface").then((mod) => mod.TinymceEditorSurface),
  {
    loading: () => <div className="min-h-[680px] bg-white" />,
    ssr: false,
  }
);

export function TinymceWorkspace() {
  return (
    <DocumentEditorWorkspace
      activeRoute="/tinymce"
      assistantDescription="Demo actions mutate the draft instantly so you can compare how TinyMCE handles imported HTML templates, especially when template CSS is injected directly into its iframe content."
      editorBadge="TinyMCE"
      EditorComponent={TinymceEditorSurface}
      templateNote="Full HTML template loaded. TinyMCE receives the imported template CSS directly as editor content styles inside its iframe, which makes it the strongest candidate for body-level template fidelity."
    />
  );
}