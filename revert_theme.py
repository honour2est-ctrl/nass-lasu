import re
import glob

replacements = {
    'dark:bg-slate-900 bg-slate-50': 'bg-slate-900',
    'dark:text-slate-300 text-slate-700': 'text-slate-300',
    'dark:text-slate-400 text-slate-600': 'text-slate-400',
    'dark:text-white text-slate-900': 'text-white',
    'dark:border-white/10 border-black/10': 'border-white/10',
    'dark:border-white/5 border-black/5': 'border-white/5',
    'dark:bg-white/5 bg-black/5': 'bg-white/5',
    'dark:bg-white/10 bg-black/10': 'bg-white/10',
    'dark:text-slate-200 text-slate-800': 'text-slate-200',
    'dark:text-slate-500 text-slate-400': 'text-slate-500',
    'dark:from-slate-900 from-slate-50': 'from-slate-900',
    'dark:via-slate-900/40 via-slate-50/40': 'via-slate-900/40',
    'dark:via-slate-900/20 via-slate-50/20': 'via-slate-900/20',
    'dark:bg-slate-800/50 bg-slate-200/50': 'bg-slate-800/50',
    'dark:bg-slate-800 bg-slate-200': 'bg-slate-800',
    'dark:from-[#020617] dark:via-[#070e27] dark:to-[#0b1536] from-slate-50 via-slate-100 to-slate-200': 'from-[#020617] via-[#070e27] to-[#0b1536]',
}

files = glob.glob('src/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    for old, new in replacements.items():
        content = content.replace(old, new)

    with open(file, 'w') as f:
        f.write(content)
