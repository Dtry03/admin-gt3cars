/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#e61212ff', // Verde esmeralda (ajustar al gusto)
        'primary-dark': '#b80606ff',
        'secondary': '#3a3a3aff',
        'dark': '#272626ff',
      }
    },
  },
  plugins: [
     require('@tailwindcss/forms'), // Para estilos de formulario bonitos
  ],
}