import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove state and effect
content = re.sub(
    r'  const \[isDarkMode, setIsDarkMode\] = useState\(\(\) => \{\n    const saved = localStorage.getItem\(\'theme\'\);\n    return saved \? saved === \'dark\' : true;\n  \}\);\n\n  useEffect\(\(\) => \{\n    if \(isDarkMode\) \{\n      document.documentElement.classList.add\(\'dark\'\);\n      localStorage.setItem\(\'theme\', \'dark\'\);\n    \} else \{\n      document.documentElement.classList.remove\(\'dark\'\);\n      localStorage.setItem\(\'theme\', \'light\'\);\n    \}\n  \}, \[isDarkMode\]\);\n',
    '',
    content
)

# Remove button
content = re.sub(
    r'              <button\n                onClick=\{\(\) => setIsDarkMode\(!isDarkMode\)\}\n                className="p-2 rounded-full bg-white/5 hover:bg-yellow-400/20 text-slate-300 hover:text-yellow-400 transition-colors"\n                aria-label="Toggle theme"\n              >\n                \{isDarkMode \? <Sun size=\{18\} /> : <Moon size=\{18\} />\}\n              </button>\n',
    '',
    content
)

# Remove div wrapper if empty/unnecessary around the links
content = re.sub(
    r'            <div className="flex items-center gap-6">\n              <div className="hidden md:flex gap-6 text-\[11px\] uppercase tracking-widest font-semibold">\n                <a href="#digitalized" className="text-slate-300 hover:text-yellow-400 transition-colors">Initiative</a>\n                <a href="#executives" className="text-slate-300 hover:text-yellow-400 transition-colors">Excos</a>\n                <a href="#vault" className="text-slate-300 hover:text-yellow-400 transition-colors">Vault</a>\n                <a href="#events" className="text-slate-300 hover:text-yellow-400 transition-colors">Events</a>\n              </div>\n            </div>',
    '            <div className="hidden md:flex gap-6 text-[11px] uppercase tracking-widest font-semibold">\n              <a href="#digitalized" className="text-slate-300 hover:text-yellow-400 transition-colors">Initiative</a>\n              <a href="#executives" className="text-slate-300 hover:text-yellow-400 transition-colors">Excos</a>\n              <a href="#vault" className="text-slate-300 hover:text-yellow-400 transition-colors">Vault</a>\n              <a href="#events" className="text-slate-300 hover:text-yellow-400 transition-colors">Events</a>\n            </div>',
    content
)

content = content.replace("import { User as UserIcon, Sun, Moon,", "import { User as UserIcon,")

with open('src/App.tsx', 'w') as f:
    f.write(content)
