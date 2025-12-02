/*
 * TF‑IDF visualizer
 *
 * Computes term frequency (TF), inverse document frequency (IDF), and
 * TF‑IDF weights for a query and three documents. Renders the TF‑IDF
 * vectors as stacked bar charts per document on a shared vocabulary axis.
 * Displays dot product and cosine similarity scores using TF‑IDF weights.
 */

let vocab = [];
let idf = [];
let queryTf = [];
let docsTf = [];
let docsTfidf = [];
let queryTfidf = [];
let scores = [];

// Tokenize text into lowercase words
function textToTokens(str) {
  return str
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter((t) => t.length > 0);
}

function computeTfIdf() {
  const queryTokens = textToTokens(
    document.getElementById("queryText").value
  );
  const docs = [
    textToTokens(document.getElementById("d1Text").value),
    textToTokens(document.getElementById("d2Text").value),
    textToTokens(document.getElementById("d3Text").value),
  ];
  // Build vocabulary across all documents and query
  const vocabSet = new Set([...queryTokens, ...docs[0], ...docs[1], ...docs[2]]);
  vocab = Array.from(vocabSet);
  const N = docs.length;
  // Compute document frequency for each term
  const df = new Array(vocab.length).fill(0);
  vocab.forEach((term, i) => {
    docs.forEach((doc) => {
      if (doc.includes(term)) df[i] += 1;
    });
  });
  // Compute IDF: log((N + 1)/(n_t + 1)) to avoid division by zero and keep positive
  idf = df.map((n_t) => {
    return Math.log((N + 1) / (n_t + 1));
  });
  // Compute TF for query
  queryTf = new Array(vocab.length).fill(0);
  vocab.forEach((term, i) => {
    const count = queryTokens.filter((t) => t === term).length;
    queryTf[i] = queryTokens.length > 0 ? count / queryTokens.length : 0;
  });
  // Compute TF for docs
  docsTf = docs.map((docTokens) => {
    const tfVec = new Array(vocab.length).fill(0);
    vocab.forEach((term, i) => {
      const count = docTokens.filter((t) => t === term).length;
      tfVec[i] = docTokens.length > 0 ? count / docTokens.length : 0;
    });
    return tfVec;
  });
  // Compute TF‑IDF for query and docs
  queryTfidf = queryTf.map((tf, i) => tf * idf[i]);
  docsTfidf = docsTf.map((tfVec) => {
    return tfVec.map((tf, i) => tf * idf[i]);
  });
  // Compute scores: dot product and cosine similarity using TF‑IDF
  const vectorMagnitude = (vec) => Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  const qMag = vectorMagnitude(queryTfidf);
  scores = docsTfidf.map((docVec) => {
    const dot = docVec.reduce((sum, v, i) => sum + v * queryTfidf[i], 0);
    const dMag = vectorMagnitude(docVec);
    const cos = qMag === 0 || dMag === 0 ? 0 : dot / (qMag * dMag);
    return { dot, cos };
  });
  updateScoreDisplay();
}

function updateScoreDisplay() {
  const el = document.getElementById("scores");
  el.innerHTML = scores
    .map(
      (sc, i) =>
        `<strong>Document ${i + 1}:</strong> dot product = ${sc.dot.toFixed(
          3
        )}, cosine similarity = ${sc.cos.toFixed(3)}`
    )
    .join("<br/>");
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("computeBtn").addEventListener("click", () => {
    computeTfIdf();
  });
});

// p5 setup
function setup() {
  // Dynamically size the canvas to match the container width for
  // responsive layouts. If the container is not available, fall back
  // to a default width of 900px.
  const container = document.getElementById("canvasContainer");
  const w = container ? container.clientWidth : 900;
  const cnv = createCanvas(w, 350);
  cnv.parent("canvasContainer");
  computeTfIdf();
}

function draw() {
  // Dark background for readability
  background(22, 24, 48);
  if (vocab.length === 0) return;
  // Determine maximum TF‑IDF weight for scaling
  const maxWeight = Math.max(1e-6, ...queryTfidf, ...docsTfidf.flat());
  const barWidth = width / vocab.length;
  for (let i = 0; i < vocab.length; i++) {
    const x = i * barWidth + barWidth * 0.1;
    const bw = barWidth * 0.8;
    // Draw query TF‑IDF (muted grey)
    const qHeight = (queryTfidf[i] / maxWeight) * 200;
    fill(120, 120, 130);
    rect(x, height - 20 - qHeight, bw / 4, qHeight);
    // Draw doc vectors: 3 docs with Manim accent colours
    for (let d = 0; d < docsTfidf.length; d++) {
      const colorMap = [
        [82, 88, 147], // doc1 blue
        [131, 193, 103], // doc2 green
        [240, 172, 95], // doc3 gold
      ];
      const h = (docsTfidf[d][i] / maxWeight) * 200;
      fill(...colorMap[d]);
      rect(x + bw / 4 + (d * bw) / 4, height - 20 - h, bw / 4, h);
    }
    // Term label rotated for compactness
    fill(220);
    textSize(10);
    push();
    translate(x + bw / 2, height - 5);
    rotate(-HALF_PI / 2);
    text(vocab[i], 0, 0);
    pop();
  }
  // Legend
  const legendColors = [
    [120, 120, 130],
    [82, 88, 147],
    [131, 193, 103],
    [240, 172, 95],
  ];
  const labels = ["Query", "Doc 1", "Doc 2", "Doc 3"];
  for (let i = 0; i < labels.length; i++) {
    fill(...legendColors[i]);
    rect(10 + i * 80, 10, 12, 12);
    fill(220);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(labels[i], 26 + i * 80, 16);
  }
}

// Resize the canvas to match the container width on window resize
function windowResized() {
  const container = document.getElementById("canvasContainer");
  if (container) {
    const newW = container.clientWidth;
    resizeCanvas(newW, 350);
  }
}