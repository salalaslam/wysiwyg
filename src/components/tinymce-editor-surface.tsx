"use client";

import { useEffect, useMemo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMceEditor } from "tinymce";

import "tinymce/icons/default/icons";
import "tinymce/models/dom/model";
import "tinymce/plugins/code";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/themes/silver/theme";
import "tinymce/tinymce";

import type { EditorSurfaceProps } from "@/components/document-editor-workspace";

const defaultContentStyle = `
  body {
    color: #17120d;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    line-height: 1.7;
    margin: 0;
    padding: 40px;
  }
  h1 {
    font-size: 2.5rem;
    line-height: 1.1;
    margin: 0 0 1rem;
  }
  h2 {
    font-size: 1.5rem;
    line-height: 1.2;
    margin: 2rem 0 0.75rem;
  }
  p {
    margin: 0 0 1rem;
  }
  ul, ol {
    margin: 0 0 1rem 1.4rem;
  }
  li {
    margin-bottom: 0.45rem;
  }
  blockquote {
    border-left: 3px solid #dd8c5b;
    color: #5d5041;
    margin: 1.5rem 0;
    padding-left: 1rem;
  }
`;

export function TinymceEditorSurface({
  isTemplateDocument,
  onChange,
  onReady,
  templateStyles,
  value,
}: EditorSurfaceProps) {
  const editorRef = useRef<TinyMceEditor | null>(null);

  const contentStyle = useMemo(() => {
    if (isTemplateDocument && templateStyles) {
      return templateStyles;
    }

    return defaultContentStyle;
  }, [isTemplateDocument, templateStyles]);

  useEffect(() => {
    return () => {
      onReady(null);
    };
  }, [onReady]);

  return (
    <div className="comparison-editor-surface min-h-[680px] overflow-hidden bg-white text-[#17120d]">
      <Editor
        licenseKey="gpl"
        tinymceScriptSrc={[]}
        value={value}
        onEditorChange={(nextValue) => {
          onChange(nextValue);
        }}
        onInit={(_, editor) => {
          editorRef.current = editor;

          onReady({
            setAlign: (align) => {
              const command = align === "center" ? "JustifyCenter" : align === "right" ? "JustifyRight" : "JustifyLeft";
              editor.execCommand(command);
              editor.focus();
            },
            toggleBold: () => {
              editor.execCommand("Bold");
              editor.focus();
            },
            toggleBullet: () => {
              editor.execCommand("InsertUnorderedList");
              editor.focus();
            },
            toggleHeading: () => {
              editor.execCommand("FormatBlock", false, "h1");
              editor.focus();
            },
          });
        }}
        init={{
          branding: false,
          content_css: false,
          content_style: contentStyle,
          height: 680,
          menubar: false,
          plugins: "lists link code",
          resize: false,
          skin: false,
          toolbar: "undo redo | blocks | bold italic | bullist numlist | alignleft aligncenter alignright | link code",
        }}
      />
    </div>
  );
}