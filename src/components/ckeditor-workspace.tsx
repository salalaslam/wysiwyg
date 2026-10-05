"use client";

import dynamic from "next/dynamic";

import { DocumentEditorWorkspace } from "@/components/document-editor-workspace";
import type { EditorSurfaceProps } from "@/components/document-editor-workspace";

const CkeditorEditorSurface = dynamic<EditorSurfaceProps>(
  () => import("@/components/ckeditor-editor-surface").then((mod) => mod.CkeditorEditorSurface),
  {
    loading: () => <div className="min-h-[680px] bg-white" />,
    ssr: false,
  }
);

export function CkeditorWorkspace() {
  return (
    <DocumentEditorWorkspace
      activeRoute="/ckeditor"
      assistantDescription="Demo actions mutate the draft instantly so you can compare how CKEditor 5 handles imported HTML templates against the other editor routes."
      editorBadge="CKEditor 5"
      EditorComponent={CkeditorEditorSurface}
      templateNote="Full HTML template loaded. CKEditor keeps general HTML support enabled and scopes the template CSS into the editable surface so classes and inline styles have a fair comparison path."
    />
  );
}