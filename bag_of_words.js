/*
 * Bag‑of‑Words visualizer
 *
 * This script tokenizes the query and two documents, constructs a shared
 * vocabulary, and computes raw term frequency (dot product) and cosine
 * similarity scores.  It renders the term counts as bar charts for each
 * document on a shared axis using p5.js.
 */

let vocab = [];
let qVec = [];
let d1Vec = [];
let d2Vec = [];
let scores = { doc1: { dot: 0, cos: 0 }, doc2: { dot: 0, cos: 0 } };
let canvas;

// Process text: lowercase, split on non‑word characters
function textToTokens(str) {
  return str
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter((t) => t.length > 0);
}

function buildVectors() {
  const qTokens = textToTokens(document.getElementById("queryText").value);
  const d1Tokens = textToTokens(document.getElementById("doc1Text").value);
  const d2Tokens = textToTokens(document.getElementById("doc2Text").value);
  // Build vocabulary: unique tokens across all texts
  const vocabSet = new Set([...qTokens, ...d1Tokens, ...d2Tokens]);
  vocab = Array.from(vocabSet);
  // Initialize vectors with zeros
  qVec = new Array(vocab.length).fill(0);
  d1Vec = new Array(vocab.length).fill(0);
  d2Vec = new Array(vocab.length).fill(0);
  // Fill counts
  vocab.forEach((term, i) => {
    qVec[i] = qTokens.filter((t) => t === term).length;
    d1Vec[i] = d1Tokens.filter((t) => t === term).length;
    d2Vec[i] = d2Tokens.filter((t) => t === term).length;
  });
  // Compute dot products
  const dot1 = qVec.reduce((sum, v, i) => sum + v * d1Vec[i], 0);
  const dot2 = qVec.reduce((sum, v, i) => sum + v * d2Vec[i], 0);
  // Compute cosine similarities
  const mag = (vec) => Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  const qMag = mag(qVec);
  const d1Mag = mag(d1Vec);
  const d2Mag = mag(d2Vec);
  const cos1 = qMag === 0 || d1Mag === 0 ? 0 : dot1 / (qMag * d1Mag);
  const cos2 = qMag === 0 || d2Mag === 0 ? 0 : dot2 / (qMag * d2Mag);
  scores = {
    doc1: { dot: dot1, cos: cos1 },
    doc2: { dot: dot2, cos: cos2 },
  };
  updateScoreDisplay();
}

function updateScoreDisplay() {
  const scoresEl = document.getElementById("scores");
  scoresEl.innerHTML = `
    <strong>Document 1:</strong> dot product = ${scores.doc1.dot.toFixed(
      2
    )}, cosine similarity = ${scores.doc1.cos.toFixed(2)}<br/>
    <strong>Document 2:</strong> dot product = ${scores.doc2.dot.toFixed(
      2
    )}, cosine similarity = ${scores.doc2.cos.toFixed(2)}
  `;
}

// Attach event listener
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("computeBtn").addEventListener("click", () => {
    buildVectors();
  });
});

// p5.js setup
function setup() {
  // Dynamically size the canvas based on the width of the container for
  // responsiveness.  Fallback to 900px if the container is unavailable.
  const container = document.getElementById("canvasContainer");
  const w = container ? container.clientWidth : 900;
  canvas = createCanvas(w, 350);
  canvas.parent("canvasContainer");
  buildVectors();
}

function draw() {
  // Dark background reminiscent of Manim’s slate backgrounds
  background(22, 24, 48);
  if (vocab.length === 0) return;
  // Determine maximum frequency among all vectors for scaling
  const maxFreq = Math.max(1, ...qVec, ...d1Vec, ...d2Vec);
  const barWidth = width / vocab.length;
  for (let i = 0; i < vocab.length; i++) {
    const x = i * barWidth + barWidth * 0.1;
    const bw = barWidth * 0.8;
    // Draw query bar (muted grey)
    const qHeight = (qVec[i] / maxFreq) * 200;
    fill(120, 120, 130);
    rect(x, height - 20 - qHeight, bw / 3, qHeight);
    // Doc1 bar (blue accent)
    const d1Height = (d1Vec[i] / maxFreq) * 200;
    fill(82, 88, 147);
    rect(x + bw / 3, height - 20 - d1Height, bw / 3, d1Height);
    // Doc2 bar (green accent)
    const d2Height = (d2Vec[i] / maxFreq) * 200;
    fill(131, 193, 103);
    rect(x + (2 * bw) / 3, height - 20 - d2Height, bw / 3, d2Height);
    // Draw term label rotated for space efficiency
    fill(220);
    textSize(10);
    textAlign(CENTER, CENTER);
    push();
    translate(x + bw / 2, height - 5);
    rotate(-HALF_PI / 2);
    text(vocab[i], 0, 0);
    pop();
  }
  // Legend
  // Query legend
  fill(120, 120, 130);
  rect(10, 10, 12, 12);
  fill(220);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("Query", 26, 16);
  // Doc1 legend
  fill(82, 88, 147);
  rect(90, 10, 12, 12);
  fill(220);
  text("Doc 1", 106, 16);
  // Doc2 legend
  fill(131, 193, 103);
  rect(150, 10, 12, 12);
  fill(220);
  text("Doc 2", 166, 16);
}

// Resize the canvas when the window is resized
function windowResized() {
  const container = document.getElementById("canvasContainer");
  if (container) {
    const newW = container.clientWidth;
    resizeCanvas(newW, 350);
  }
}