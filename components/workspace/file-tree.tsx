"use client";

import { useState } from "react";
import type { FileTreeNode } from "@/lib/agent/executor";

interface FileTreeProps {
  nodes: FileTreeNode[];
  onSelectFile: (path: string) => void;
  prefix?: string;
}

export function FileTree({ nodes, onSelectFile, prefix = "" }: FileTreeProps) {
  return (
    <ul className="text-sm">
      {nodes.map((node) => (
        <FileTreeItem
          key={prefix + node.name}
          node={node}
          path={prefix ? `${prefix}/${node.name}` : node.name}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  );
}

function FileTreeItem({
  node,
  path,
  onSelectFile,
}: {
  node: FileTreeNode;
  path: string;
  onSelectFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.type === "directory") {
    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full text-left py-0.5 px-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <span className="text-xs">{expanded ? "▼" : "▶"}</span>
          <span>📁 {node.name}</span>
        </button>
        {expanded && node.children && (
          <div className="ml-3">
            <FileTree
              nodes={node.children}
              onSelectFile={onSelectFile}
              prefix={path}
            />
          </div>
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => onSelectFile(path)}
        className="flex items-center gap-1 w-full text-left py-0.5 px-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ml-3"
      >
        <span>📄 {node.name}</span>
      </button>
    </li>
  );
}
