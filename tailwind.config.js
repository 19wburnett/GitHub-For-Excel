/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'diff-added': '#d4edda',
        'diff-removed': '#f8d7da',
        'diff-changed': '#fff3cd',
      },
    },
  },
  plugins: [],
}
