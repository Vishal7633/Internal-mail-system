import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FolderTree,
  FileCode,
  Database,
} from 'lucide-react';
import {
  JAVA_PROJECT_FILES,
  JavaSourceFile,
  buildDatabaseConnectionCode,
} from '../data/javaProjectFiles';

interface JavaCodeExplorerViewProps {
  dbConfig: {
    host: string;
    port: string;
    dbName: string;
    user: string;
    password: string;
  };
  onDownloadBundle: () => void;
}

export const JavaCodeExplorerView: React.FC<JavaCodeExplorerViewProps> = ({
  dbConfig,
  onDownloadBundle,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>('main');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filesWithLiveConfig: JavaSourceFile[] = JAVA_PROJECT_FILES.map((f) =>
    f.id === 'db-conn'
      ? { ...f, code: buildDatabaseConnectionCode(dbConfig) }
      : f
  );

  const activeFile =
    filesWithLiveConfig.find((f) => f.id === selectedFileId) ||
    filesWithLiveConfig[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadSingleFile = (file: JavaSourceFile) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const packageGroups: { label: string; category: JavaSourceFile['category'][] }[] = [
    { label: 'Entry Point (com.internalmail)', category: ['entry'] },
    { label: 'Database Layer (com.internalmail.database)', category: ['database'] },
    { label: 'Model Layer (com.internalmail.model)', category: ['model'] },
    { label: 'DAO Layer (com.internalmail.dao)', category: ['dao'] },
    { label: 'Security & UI Utils (com.internalmail.utils)', category: ['utils'] },
    { label: 'Swing GUI Layer (com.internalmail.ui)', category: ['ui'] },
    { label: 'MySQL Database Script (sql/)', category: ['sql'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            Complete Java Swing + MySQL Source Code
          </h2>
          <p className="text-xs text-slate-600">
            Organized into <code className="font-mono">model</code>, <code className="font-mono">dao</code>, <code className="font-mono">database</code>, <code className="font-mono">ui</code>, and <code className="font-mono">utils</code> packages. All files are also saved in <code className="font-mono">/java-swing-mail-system/</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onDownloadBundle}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download All Project Files (.txt / Script)
          </button>
        </div>
      </div>

      {/* Main Split Code Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Package Tree Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FolderTree className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">
              Project Package Structure
            </span>
          </div>

          <div className="space-y-4">
            {packageGroups.map((group) => {
              const groupFiles = filesWithLiveConfig.filter((f) =>
                group.category.includes(f.category)
              );
              return (
                <div key={group.label} className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 px-2">
                    {group.label}
                  </div>
                  {groupFiles.map((file) => {
                    const isSelected = file.id === activeFile.id;
                    return (
                      <button
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
                        className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {file.category === 'sql' ? (
                            <Database className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <FileCode className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="font-mono truncate">{file.fileName}</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {file.code.split('\n').length}L
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Source Code Viewer */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-slate-900">
                  {activeFile.relativePath}
                </span>
              </div>
              <p className="text-xs text-slate-600">{activeFile.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(activeFile.code, activeFile.id)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                {copiedId === activeFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Source
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadSingleFile(activeFile)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download {activeFile.fileName}
              </button>
            </div>
          </div>

          <pre className="p-5 bg-[#0F172A] text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto max-h-[680px]">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
