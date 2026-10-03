import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { buildDatabaseConnectionCode } from '../data/javaProjectFiles';
import { INITIAL_USERS, DEFAULT_DEMO_PASSWORD } from '../data/seedData';

interface IdeSetupGuideViewProps {
  dbConfig: {
    host: string;
    port: string;
    dbName: string;
    user: string;
    password: string;
  };
  onChangeDbConfig: (next: {
    host: string;
    port: string;
    dbName: string;
    user: string;
    password: string;
  }) => void;
}

export const IdeSetupGuideView: React.FC<IdeSetupGuideViewProps> = ({
  dbConfig,
  onChangeDbConfig,
}) => {
  const [copiedConn, setCopiedConn] = useState(false);

  const generatedConnectionJava = buildDatabaseConnectionCode(dbConfig);

  const handleCopyConn = () => {
    navigator.clipboard.writeText(generatedConnectionJava);
    setCopiedConn(true);
    setTimeout(() => setCopiedConn(false), 1800);
  };

  const handleDownloadConn = () => {
    const blob = new Blob([generatedConnectionJava], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DatabaseConnection.java';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Interactive DatabaseConnection.java Configurator */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            01. Configure Database Username, Password, and Database Name
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Customize your local MySQL credentials below. This automatically updates <code className="font-mono">src/com/internalmail/database/DatabaseConnection.java</code> across the code explorer and downloads.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              DB_HOST
            </label>
            <input
              type="text"
              value={dbConfig.host}
              onChange={(e) => onChangeDbConfig({ ...dbConfig, host: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              DB_PORT
            </label>
            <input
              type="text"
              value={dbConfig.port}
              onChange={(e) => onChangeDbConfig({ ...dbConfig, port: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              DB_NAME
            </label>
            <input
              type="text"
              value={dbConfig.dbName}
              onChange={(e) => onChangeDbConfig({ ...dbConfig, dbName: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              DB_USER
            </label>
            <input
              type="text"
              value={dbConfig.user}
              onChange={(e) => onChangeDbConfig({ ...dbConfig, user: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              DB_PASSWORD
            </label>
            <input
              type="text"
              value={dbConfig.password}
              onChange={(e) => onChangeDbConfig({ ...dbConfig, password: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-800">
              src/com/internalmail/database/DatabaseConnection.java
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyConn}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedConn ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadConn}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
          <pre className="p-4 bg-[#0F172A] text-slate-100 font-mono text-xs overflow-x-auto">
            <code>{generatedConnectionJava}</code>
          </pre>
        </div>
      </div>

      {/* Section 2: Where to Add MySQL Connector/J .jar File */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            02. Where to Add the MySQL Connector/J (.jar) File
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Download the platform-independent <code className="font-mono">mysql-connector-j-8.3.0.jar</code> (or 8.x/9.x) from the official MySQL Community Downloads page (<code className="font-mono">dev.mysql.com/downloads/connector/j/</code> → Select Operating System: <strong>Platform Independent</strong> → Download the <code className="font-mono">.zip</code> or <code className="font-mono">.tar.gz</code> archive and extract the <code className="font-mono">.jar</code> file into a <code className="font-mono">lib/</code> folder inside your project).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IntelliJ IDEA Guide */}
          <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              Option A: Adding the .jar in IntelliJ IDEA
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                Create a folder named <code className="font-mono font-semibold">lib</code> at the root of your project and place <code className="font-mono font-semibold">mysql-connector-j-8.3.0.jar</code> inside it.
              </li>
              <li>
                In IntelliJ IDEA, open <strong>File → Project Structure...</strong> (shortcut: <code className="font-mono">Ctrl+Alt+Shift+S</code> on Windows/Linux or <code className="font-mono">Cmd+;</code> on macOS).
              </li>
              <li>
                In the left sidebar under <strong>Project Settings</strong>, click <strong>Modules</strong>, then select the <strong>Dependencies</strong> tab.
              </li>
              <li>
                Click the <strong>+</strong> icon → select <strong>1. JARs or Directories...</strong>
              </li>
              <li>
                Select <code className="font-mono">lib/mysql-connector-j-8.3.0.jar</code>, ensure the scope is set to <strong>Compile</strong>, and click <strong>Apply</strong> then <strong>OK</strong>.
              </li>
            </ol>
          </div>

          {/* VS Code Guide */}
          <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              Option B: Adding the .jar in Visual Studio Code
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                Install the official <strong>Extension Pack for Java</strong> from the VS Code Extensions marketplace.
              </li>
              <li>
                Place <code className="font-mono font-semibold">mysql-connector-j-8.3.0.jar</code> inside your project's <code className="font-mono font-semibold">lib/</code> folder.
              </li>
              <li>
                In the Explorer sidebar, expand the <strong>JAVA PROJECTS</strong> panel at the bottom, locate <strong>Referenced Libraries</strong>, and click the <strong>+</strong> icon to select your <code className="font-mono">.jar</code> file.
              </li>
              <li>
                Alternatively, add this to <code className="font-mono">.vscode/settings.json</code>:
                <pre className="mt-1.5 p-2 bg-slate-900 text-slate-100 rounded font-mono text-[11px] overflow-x-auto">
                  {`{\n  "java.project.sourcePaths": ["src"],\n  "java.project.referencedLibraries": ["lib/**/*.jar"]\n}`}
                </pre>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Section 3: Step-by-Step Instructions to Run */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          03. Step-by-Step Instructions to Run the Project
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">
              Step 1 — Initialize the MySQL Database
            </div>
            <p>
              Start your local MySQL Server (port 3306) and execute <code className="font-mono">sql/schema_and_seed.sql</code> to create <code className="font-mono">internal_mail_db</code>, the <code className="font-mono">users</code> and <code className="font-mono">messages</code> tables, and sample records:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-xs overflow-x-auto">
              {`mysql -u root -p < sql/schema_and_seed.sql`}
            </pre>

            <div className="font-bold text-slate-900 text-sm pt-2">
              Step 2 — Verify Project Folder Layout
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-xs overflow-x-auto">
{`java-swing-mail-system/
├── lib/
│   └── mysql-connector-j-8.3.0.jar
├── sql/
│   └── schema_and_seed.sql
└── src/
    └── com/
        └── internalmail/
            ├── Main.java
            ├── database/
            │   └── DatabaseConnection.java
            ├── model/
            │   ├── User.java
            │   └── Message.java
            ├── dao/
            │   ├── UserDAO.java
            │   └── MessageDAO.java
            ├── utils/
            │   ├── SecurityUtils.java
            │   └── UITheme.java
            └── ui/
                ├── LoginFrame.java
                ├── RegisterFrame.java
                ├── DashboardFrame.java
                └── MessageDetailDialog.java`}
            </pre>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">
              Step 3 — Compile & Run via IDE or Terminal
            </div>
            <p>
              In <strong>IntelliJ IDEA</strong> or <strong>VS Code</strong>, open <code className="font-mono">src/com/internalmail/Main.java</code> and click the green <strong>Run main()</strong> button next to <code className="font-mono">public static void main(String[] args)</code>.
            </p>
            <p>
              Or compile and launch directly from the terminal:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-xs overflow-x-auto">
{`# Linux / macOS:
mkdir -p out
javac -d out -cp "lib/mysql-connector-j-8.3.0.jar" \\
  $(find src -name "*.java")
java -cp "out:lib/mysql-connector-j-8.3.0.jar" \\
  com.internalmail.Main

# Windows (Command Prompt / PowerShell):
mkdir out
javac -d out -cp "lib\\mysql-connector-j-8.3.0.jar" ^
  src\\com\\internalmail\\Main.java ^
  src\\com\\internalmail\\database\\*.java ^
  src\\com\\internalmail\\model\\*.java ^
  src\\com\\internalmail\\dao\\*.java ^
  src\\com\\internalmail\\utils\\*.java ^
  src\\com\\internalmail\\ui\\*.java
java -cp "out;lib\\mysql-connector-j-8.3.0.jar" com.internalmail.Main`}
            </pre>

            <div className="font-bold text-slate-900 text-sm pt-2">
              Step 4 — Sample Users & Credentials for Testing
            </div>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-semibold">
                    <th className="py-2 px-2.5">Name</th>
                    <th className="py-2 px-2.5">Username</th>
                    <th className="py-2 px-2.5">Email</th>
                    <th className="py-2 px-2.5">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {INITIAL_USERS.map((u) => (
                    <tr key={u.id}>
                      <td className="py-1.5 px-2.5 font-sans font-medium">{u.name}</td>
                      <td className="py-1.5 px-2.5">{u.username}</td>
                      <td className="py-1.5 px-2.5 text-blue-700">{u.email}</td>
                      <td className="py-1.5 px-2.5 text-emerald-700 font-semibold">
                        {DEFAULT_DEMO_PASSWORD}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
