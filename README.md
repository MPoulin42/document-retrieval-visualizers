# Document Retrieval Visualizers

This repository contains a collection of interactive visualizers that illustrate
key concepts in classical information retrieval.  Each visualizer is built with
[p5.js](https://p5js.org), a JavaScript library for creative coding, and is
intended to feel reminiscent of the animated explanations popularized by
3Blue1Brown.  The topics covered here follow the structure of the provided
lecture slides and include:

* **Tokenization & Vocabulary Generation** – see how raw text is broken into
  tokens, how a corpus vocabulary is constructed, and how lemmatization and
  stop‐word removal change the resulting representation.  The visualizer lets
  you input your own text or use sample documents and watch the tokens spring
  into life.
* **Bag‑of‑Words Scoring** – explore how documents and queries become
  high‑dimensional vectors, how the dot product scores documents, and why
  cosine similarity normalizes for document length.  Adjust term frequencies
  interactively and see the scores update in real time.  For reference, the
  cosine similarity between two document vectors \(V(d_1)\) and \(V(d_2)\)
  divides the dot product by the product of the vector norms【453858609237474†L30-L42】.
* **TF‑IDF Weighting** – learn how term frequency and inverse document
  frequency combine to emphasize distinctive words.  The visualizer implements
  the TF‑IDF formulation described by GeeksforGeeks【419773029504566†L110-L124】 and allows you to
  add or remove documents to see how IDF values evolve.
* **BM25 Ranking** – experiment with the parameters \(k_1\) and \(b\) in the
  Okapi BM25 algorithm and see how they affect document scores.  The
  implementation follows the formula presented by GeeksforGeeks【631402620494145†L139-L180】.

All of the pages are served from the repository’s GitHub Pages site.  Visit
`index.html` to navigate between visualizers.  Feel free to fork or modify the
code—everything here is licensed under the MIT license.

## Running locally

No build step is required.  Simply open `index.html` in a modern browser
or serve the directory with a simple HTTP server:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000/` and click on the links.
