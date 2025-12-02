/*
 * Tokenization visualizer
 *
 * This script uses p5.js to render tokens as floating bubbles.  Users can
 * tokenize an input string, apply a simple lemmatizer, and remove stop words.
 */

// Global variables
let tokens = [];
let canvas;

// Dictionary mapping lemmas to lists of surface forms
const lemmaMapping = {
  bob: ["bob", "bobs", "bob's", "bob’s"],
  run: ["run", "runs", "running", "ran"],
  bike: ["bike", "bikes", "bike's", "bike’s"],
  fox: ["fox", "foxes"],
  dog: ["dog", "dogs"],
};

// Flatten lemmaMapping for reverse lookup
const formToLemma = {};
for (const lemma in lemmaMapping) {
  lemmaMapping[lemma].forEach((form) => {
    formToLemma[form] = lemma;
  });
}

// Stop words list
const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "but",
  "is",
  "are",
  "was",
  "were",
  "he",
  "she",
  "they",
  "of",
  "to",
  "in",
  "on",
  "over",
  "by",
  "with",
  "for",
  "it",
  "as",
  "his",
  "her",
  "its",
]);

// Token class to store properties
class Token {
  constructor(text) {
    this.original = text;
    this.text = text;
    this.removed = false;
    this.x = Math.random() * 750 + 25;
    this.y = Math.random() * 250 + 25;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  // Animate towards target position
  update() {
    const ease = 0.1;
    this.x += (this.targetX - this.x) * ease;
    this.y += (this.targetY - this.y) * ease;
  }

  draw() {
    if (this.removed) return;
    // Choose colours from the Manim palette.  Lemmatized tokens use a
    // green hue, while original tokens use a blue hue.  The text is
    // rendered in off‑white for contrast against the dark background.
    const isLemma = this.text !== this.original;
    const lemmaCol = [131, 193, 103]; // #83C167
    const normalCol = [82, 88, 147]; // #525893
    const c = isLemma ? lemmaCol : normalCol;
    fill(...c);
    stroke(255);
    textAlign(CENTER, CENTER);
    ellipse(this.x, this.y, 60, 60);
    fill(240);
    noStroke();
    textSize(14);
    text(this.text, this.x, this.y);
  }
}

function tokenizeText() {
  const input = document.getElementById("inputText").value;
  // Split on any sequence of non‑word characters; convert to lowercase
  const rawTokens = input
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter((t) => t.length > 0);
  tokens = rawTokens.map((t) => new Token(t));
  repositionTokens();
  updateVocabularyInfo();
}

function applyLemmatization() {
  tokens.forEach((token) => {
    if (token.removed) return;
    const lemma = formToLemma[token.text];
    if (lemma) {
      token.text = lemma;
    }
  });
  repositionTokens();
  updateVocabularyInfo();
}

function removeStopWords() {
  tokens.forEach((token) => {
    if (stopWords.has(token.text)) {
      token.removed = true;
    }
  });
  repositionTokens();
  updateVocabularyInfo();
}

function repositionTokens() {
  // Arrange remaining tokens in a grid layout for readability
  const visibleTokens = tokens.filter((t) => !t.removed);
  const cols = Math.ceil(Math.sqrt(visibleTokens.length));
  const spacingX = width / (cols + 1);
  const spacingY = height / (cols + 1);
  visibleTokens.forEach((token, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    token.targetX = spacingX * (col + 1);
    token.targetY = spacingY * (row + 1);
  });
}

function updateVocabularyInfo() {
  const vocab = Array.from(
    new Set(tokens.filter((t) => !t.removed).map((t) => t.text))
  ).sort();
  const infoEl = document.getElementById("vocabInfo");
  if (vocab.length === 0) {
    infoEl.textContent = "Vocabulary is empty.";
  } else {
    infoEl.textContent = `Vocabulary (${vocab.length}): ${vocab.join(", ")}`;
  }
}

// Attach event listeners after DOM has loaded
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tokenizeBtn").addEventListener("click", tokenizeText);
  document.getElementById("lemmatizeBtn").addEventListener("click", applyLemmatization);
  document.getElementById("stopwordBtn").addEventListener("click", removeStopWords);
});

// p5.js functions
function setup() {
  // Dynamically size the canvas to the width of the container.  On small
  // screens the container will shrink, ensuring the visualization remains
  // legible.  Fallback to 800px if the container is not yet available.
  const container = document.getElementById("canvasContainer");
  const w = container ? container.clientWidth : 800;
  canvas = createCanvas(w, 300);
  canvas.parent("canvasContainer");
  // Initialize with default text
  tokenizeText();
}

function draw() {
  // Dark background for Manim‑inspired aesthetic
  background(22, 24, 48);
  tokens.forEach((token) => {
    token.update();
    token.draw();
  });
}

// Resize the canvas when the window size changes
function windowResized() {
  const container = document.getElementById("canvasContainer");
  if (container) {
    const newW = container.clientWidth;
    resizeCanvas(newW, 300);
    repositionTokens();
  }
}