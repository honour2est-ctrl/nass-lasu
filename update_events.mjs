import fs from 'fs';

const pageant = fs.readdirSync('public/pageant').map(f => '/pageant/' + f);
const awards = fs.readdirSync('public/awards').map(f => '/awards/' + f);
const svf = fs.readdirSync('public/science-vs-food').map(f => '/science-vs-food/' + f);

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const INITIAL_EVENTS_DATA = \[[\s\S]*?\];/,
  `const INITIAL_EVENTS_DATA = [
  {
    id: 1,
    title: "MR AND MISS NASS LASU FRESHER",
    category: "Science Week",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    images: ${JSON.stringify(pageant)}
  },
  {
    id: 2,
    title: "NASS LASU DINNER AND AWARD NIGHT",
    category: "Awards and Recognitions",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    images: ${JSON.stringify(awards)}
  },
  {
    id: 3,
    title: "SCIENCE VS FOOD 3.0",
    category: "Science Vs Food",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    images: ${JSON.stringify(svf)}
  }
];`
);

fs.writeFileSync('src/App.tsx', content);
