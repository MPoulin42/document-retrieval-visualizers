/*
 * Okapi BM25 visualizer
 *
 * Computes BM25 scores for a query against three documents and visualises
 * the resulting document scores and term contributions. Supports interactive
 * adjustment of the parameters k1 and b as described in the BM25 formula.
 * The IDF computation has been adjusted to avoid negative values by
 * smoothing the numerator and denominator with +0.5 and using (N+0.5)/(n_t+0.5).
 */

let docs = [];
let vocab = [];
let idf = {};
let docLengths = [];
let avgDocLength = 0;
let scores = [];
let termContribs = [];

function textToTokens(str) {
  return str
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter((t) => t.length > 0);
}

function computeBm25() {
  const qTokens = textToTokens(document.getElementById("queryText").value);
  docs = [
    textToTokens(document.getElementById("d1Text").value),
    textToTokens(document.getElementById("d2Text").value),
    textToTokens(document.getElementById("d3Text").value),
  ];
  const N = docs.length;
  // Vocabulary includes only terms present in the query for scoring
  vocab = Array.from(new Set(qTokens));
  // Document frequency: number of documents containing term
  const df = {};
  vocab.forEach((term) => {
    df[term] = docs.reduce((count, doc) => (doc.includes(term) ? count + 1 : count), 0);
  });
  // Compute IDF per term using a smoothed positive formula
  idf = {};
  vocab.forEach((term) => {
    const nt = df[term];
    // Add 0.5 to numerator and denominator as smoothing (BM25 formula)
    idf[term] = Math.log((N + 0.5) / (nt + 0.5));
  });
  // Document lengths and average length
  docLengths = docs.map((doc) => doc.length);
  avgDocLength = docLengths.reduce((a, b) => a + b, 0) / N;
  // Parameters
  const k1 = parseFloat(document.getElementById("k1").value);
  const b = parseFloat(document.getElementById("b").value);
  // Compute scores and term contributions
  scores = [];
  termContribs = [];
  docs.forEach((doc, idx) => {
    let score = 0;
    const contribs = {};
    vocab.forEach((term) => {
      const f = doc.filter((t) => t === term).length;
      if (f === 0) {
        contribs[term] = 0;
        return;
      }
      const numerator = f * (k1 + 1);
      const denominator = f + k1 * (1 - b + b * (docLengths[idx] / avgDocLength));
      const termScore = idf[term] * (numerator / denominator);
      contribs[term] = termScore;
      score += termScore;
    });
    scores.push(score);
    termContribs.push(contribs);
  });
  updateScoreDisplay();
}

function updateScoreDisplay() {
  const el = document.getElementById("scores");
  let html = scores
    .map((score, idx) => `<strong>Document ${idx + 1}:</strong> BM25 score = ${score.toFixed(3)}`)
    .join("<br/>");
  // Add parameter values
  const k1Val = parseFloat(document.getElementById("k1").value).toFixed(2);
  const bVal = parseFloat(document.getElementById("b").value).toFixed(2);
  html += `<br/><em>k<sub>1</sub> = ${k1Val}, b = ${bVal}</em>`;
  el.innerHTML = html;
  // Update displayed parameter values near sliders
  document.getElementById("k1Val").textContent = k1Val;
  document.getElementById("bVal").textContent = bVal;
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("computeBtn").addEventListener("click", () => {
    computeBm25();
  });
  // Also recompute when sliders move
  document.getElementById("k1").addEventListener("input", () => {
    computeBm25();
  });
  document.getElementById("b").addEventListener("input", () => {
    computeBm25();
  });
});

function setup() {
  // Dynamically size the canvas based on the width of the container. If
  // the container is unavailable, fall back to 900px. This allows the
  // visualization to adapt on mobile screens.
  const container = document.getElementById("canvasContainer");
  const w = container ? container.clientWidth : 900;
  const cnv = createCanvas(w, 350);
  cnv.parent("canvasContainer");
  computeBm25();
}

function draw() {
  // Dark background for Manim aesthetic
  background(22, 24, 48);
  if (scores.length === 0 || vocab.length === 0) return;
  // Determine maximum absolute score for scaling; ensure non‑zero
  const maxAbsScore = Math.max(1e-6, ...scores.map((s) => Math.abs(s)));
  // Compute bar dimensions based on available width. Maintain a small
  // horizontal margin and equal spacing between bars.
  const numBars = scores.length;
  const margin = 40;
  const barSpacing = 20;
  const availableW = width - margin * 2 - barSpacing * (numBars - 1);
  const barWidth = availableW / numBars;
  for (let i = 0; i < numBars; i++) {
    const x = margin + i * (barWidth + barSpacing);
    // Scale bar height relative to max absolute score. Bars extend upward.
    const barHeight = (scores[i] / maxAbsScore) * 200;
    // Colour palette: Doc1 blue, Doc2 green, Doc3 red/orange
    const colors = [
      [82, 88, 147], // doc1
      [131, 193, 103], // doc2
      [224, 122, 95], // doc3
    ];
    fill(...colors[i]);
    // Draw bar: anchor at bottom, height can be negative if score negative
    rect(x, height - 20 - barHeight, barWidth, barHeight);
    // Document label and score
    fill(220);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(`Doc ${i + 1}`, x + barWidth / 2, height - 5);
    textSize(12);
    text(scores[i].toFixed(2), x + barWidth / 2, height - 30 - barHeight);
  }
}

// Resize the canvas when the window size changes
function windowResized() {
  const container = document.getElementById("canvasContainer");
  if (container) {
    const newW = container.clientWidth;
    resizeCanvas(newW, 350);
  }
}