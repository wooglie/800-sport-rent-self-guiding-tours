import dynamic from "next/dynamic";
import { Skeleton } from "./Skeleton";

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const Inner = dynamic(
  () => import("./RichTextEditorInner").then((m) => m.RichTextEditorInner),
  { ssr: false }
);

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
}: RichTextEditorProps) {
  return (
    <Inner
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  );
}
