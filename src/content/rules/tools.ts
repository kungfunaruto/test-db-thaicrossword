// Links and files for the challenge tools. Their on-screen text is in src/i18n (tools.*).
export const collins = { tools: 'https://scrabble.collinsdictionary.com/tools/', check: 'https://scrabble.collinsdictionary.com/check/' };
/** Set `available: true` once ThaiWordChallenge.exe has been built on Windows and copied to public/downloads/ (see tools/kumkom-challenge/README.md). */
export const kumkomExe = { available: false, url: '/downloads/ThaiWordChallenge.exe', fileName: 'ThaiWordChallenge.exe', sizeLabel: '', updated: '' };
export const dictionaries = { en: { url: '/dictionary/enable1.txt' }, th: { url: '/dictionary/kumkom-words.txt' } } as const;
