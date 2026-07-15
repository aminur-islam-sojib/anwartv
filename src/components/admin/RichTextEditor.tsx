"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  content,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full my-4" },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[300px] p-4 focus:outline-none focus:ring-1 focus:ring-[#cc0000] border border-t-0 border-slate-200 rounded-b-lg bg-white overflow-y-auto text-slate-800 font-sans",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  // টুলবারের বোতামগুলোর জন্য একটি হেল্পার ফাংশন
  const MenuButton = ({ onClick, isActive, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-slate-100 transition-colors ${
        isActive ? "bg-slate-200 text-[#cc0000]" : "text-slate-600"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* টুলবার লেয়ার */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-2 border-b border-slate-200 sticky top-0 z-10">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        >
          <Strikethrough className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        >
          <Quote className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => {
            const url = window.prompt("ইমেজ ইউআরএল (URL) দিন:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="grow flex justify-end gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* এডিটর রাইটিং এরিয়া */}
      <EditorContent editor={editor} />
    </div>
  );
}
