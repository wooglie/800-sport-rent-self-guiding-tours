"use client";

import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";

type RichTextEditorInnerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function RichTextEditorInner({
  value,
  onChange,
  placeholder,
  minHeight = 200,
}: RichTextEditorInnerProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={minHeight}
        textareaProps={{ placeholder }}
        preview="edit"
      />
    </div>
  );
}
