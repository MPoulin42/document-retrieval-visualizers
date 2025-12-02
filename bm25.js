/*
 * Okapi BM25 visualizer
 *
 * Computes BM25 scores for a query against three documents and visualizes
 * the resulting document scores and term contributions.  Supports interactive
 * adjustment of the parameters k1 and b as described in the BM25 formula【631402620494145†L139-L180】.
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
  // Compute IDF per term
  idf = {};
  vocab.forEach((term) => {
    const nt = df[term];
    // Add 0.5 to numerator and denominator as smoothing (BM25 formula)
    idf[term] = Math.log((N - nt + 0.5) / (nt + 0.5 + 1e-10));
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
    .map(
      (score, idx) =>
        `<strong>Document ${idx + 1}:</strong> BM25 score = ${score.toFixed(3)}`
    )
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
  const cnv = createCanvas(900, 350);
  cnv.parent("canvasContainer");
  computeBm25();
}

function draw() {
  background(249, 249, 251);
  if (scores.length === 0 || vocab.length === 0) return;
  // Determine maximum score for scaling
  const maxScore = Math.max(...scores, 1e-6);
  // Plot scores for each document as vertical bars
  const barWidth = 150;
  const spacing = (width - 3 * barWidth) / 4;
  for (let i = 0; i < scores.length; i++) {
    const x = spacing + i * (barWidth + spacing);
    const barHeight = (scores[i] / maxScore) * 200;
    // Use color palette similar to other visualizers
    const colors = [
      [49, 76, 182],
      [44, 179, 76],
      [199, 87, 87],
    ];
    fill(...colors[i]);
    rect(x, height - 20 - barHeight, barWidth, barHeight);
    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(`Doc ${i + 1}`, x + barWidth / 2, height - 5);
    // Annotate score value
    textSize(12);
    text(scores[i].toFixed(2), x + barWidth / 2, height - 30 - barHeight);
  }
  // Optionally visualize term contributions as stacked segments inside bars
  // Compute contributions normalized by max score to scale heights
  for (let i = 0; i < scores.length; i++) {
    const x = spacing + i * (barWidth + spacing);
    let yPos = height - 20;
    // Sort terms by contribution descending for stacking
    const contributions = termContribs[i];
    const sortedTerms = Object.keys(contributions).sort(
      (a, b) => contributions[b] - contributions[a]
    );
    sortedTerms.forEach((term, idx) => {
      const contrib = contributions[term];
      if (contrib <= 0) return;
      const h = (contrib / maxScore) * 200;
      // Use different color shades per term
      const colHue = (idx * 80) % 360;
      fill(color(`hsl(${colHue},70%,60%)`));
      rect(x, yPos - h, barWidth, h);
      yPos -= h;
    });
  }
}