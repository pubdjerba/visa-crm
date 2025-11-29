/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "!./node_modules/**"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                slate: {
                    950: '#020617',
                }
            }
        },
    },
    plugins: [],
}
