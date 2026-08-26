import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

console.log("Testing jsPDF instantiation...");
const doc = new jsPDF({ unit: 'pt', format: 'a4' });
doc.text("Hello World", 50, 50);
const buffer = doc.output('arraybuffer');
fs.writeFileSync(path.join(process.cwd(), 'scratch', 'test.pdf'), Buffer.from(buffer));
console.log("Wrote scratch/test.pdf successfully!");
