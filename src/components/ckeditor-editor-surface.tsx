"use client";

import { useEffect, useMemo, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  Bold,
  ClassicEditor,
  Essentials,
  GeneralHtmlSupport,
  Heading,
  Italic,
  List,
  Paragraph,
  SourceEditing,
  type Editor as CkEditorInstance,
} from "ckeditor5";

import type { EditorSurfaceProps } from "@/components/document-editor-workspace";
import { scopeCssText } from "@/lib/editor-html";
import { cn } from "@/lib/utils";

export function CkeditorEditorSurface({
  isTemplateDocument,
  onChange,
  onReady,
  templateStyles,
  value,
}: EditorSurfaceProps) {
  const editorRef = useRef<CkEditorInstance | null>(null);
  const lastSyncedHtmlRef = useRef("");

  const scopedTemplateStyles = useMemo(() => {
    if (!isTemplateDocument || !templateStyles) {
      return "";
    }

    return scopeCssText(templateStyles, ".ck-content");
  }, [isTemplateDocument, templateStyles]);

  useEffect(() => {
    return () => {
      onReady(null);
    };
  }, [onReady]);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || value === lastSyncedHtmlRef.current || editor.getData() === value) {
      return;
    }

    editor.setData(value);
    lastSyncedHtmlRef.current = value;
  }, [value]);

  return (
    <div className={cn("comparison-editor-surface min-h-[680px] overflow-auto", isTemplateDocument && "bg-white text-[#17120d]")}>
      {scopedTemplateStyles ? <style>{scopedTemplateStyles}</style> : null}
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          heading: {
            options: [
              { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
              { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
              { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
            ],
          },
          htmlSupport: {
            allow: [
              {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true,
              },
            ],
          },
          licenseKey: "GPL",
          plugins: [Alignment, Bold, Essentials, GeneralHtmlSupport, Heading, Italic, List, Paragraph, SourceEditing],
          toolbar: ["undo", "redo", "|", "heading", "|", "bold", "italic", "|", "bulletedList", "numberedList", "|", "alignment", "|", "sourceEditing"],
        }}
        onReady={(editor) => {
          editorRef.current = editor;
          lastSyncedHtmlRef.current = editor.getData();

          onReady({
            setAlign: (align) => {
              editor.execute("alignment", { value: align });
              editor.editing.view.focus();
            },
            toggleBold: () => {
              editor.execute("bold");
              editor.editing.view.focus();
            },
            toggleBullet: () => {
              editor.execute("bulletedList");
              editor.editing.view.focus();
            },
            toggleHeading: () => {
              editor.execute("heading", { value: "heading1" });
              editor.editing.view.focus();
            },
          });
        }}
        onChange={(_, editor) => {
          const nextValue = editor.getData();
          lastSyncedHtmlRef.current = nextValue;
          onChange(nextValue);
        }}
      />
    </div>
  );
}