"use client";

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState, SerializedEditorState } from "lexical";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot, $insertNodes } from "lexical";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { TooltipProvider } from "@/components/ui/tooltip";

import { nodes } from "./nodes";
import { Plugins } from "./plugins";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

// Create a plugin to load HTML content
function HtmlPlugin({ html }: { html?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!html) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);

      // Clear existing content and insert new nodes
      $getRoot().clear();
      $getRoot().select();
      $insertNodes(nodes);
    });
  }, [html, editor]);

  return null;
}

// Create a plugin to handle HTML change callbacks
function HtmlChangePlugin({
  onChange,
  onHtmlChange,
}: {
  onChange?: (editorState: EditorState) => void;
  onHtmlChange?: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      ignoreSelectionChange={true}
      onChange={(editorState) => {
        onChange?.(editorState);

        // Generate HTML string from editor state
        if (onHtmlChange) {
          editorState.read(() => {
            const html = $generateHtmlFromNodes(editor);
            onHtmlChange(html);
          });
        }
      }}
    />
  );
}

export function Editor({
  editorState,
  editorSerializedState,
  htmlContent,
  onChange,
  onHtmlChange,
}: {
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  htmlContent?: string;
  onChange?: (editorState: EditorState) => void;
  onHtmlChange?: (html: string) => void;
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
        }}
      >
        <TooltipProvider>
          <Plugins />
          <HtmlPlugin html={htmlContent} />
          <HtmlChangePlugin onChange={onChange} onHtmlChange={onHtmlChange} />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}
