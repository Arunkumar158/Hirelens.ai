import logging
import re
import string

import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------

def preprocess(text: str) -> str:
    """
    Clean and normalise a text string for TF-IDF analysis.

    Steps:
    1. Lowercase
    2. Strip punctuation (keep letters, digits, whitespace)
    3. Tokenise on whitespace
    4. Remove English NLTK stopwords
    5. Remove tokens shorter than 2 characters

    Returns:
        A single string of cleaned tokens joined by spaces.
    """
    # 1. Lowercase
    text = text.lower()

    # 2. Remove punctuation — keep letters, numbers, and whitespace
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # 3. Tokenise
    tokens = text.split()

    # 4. Remove stopwords
    stop_words = set(stopwords.words("english"))

    # 5. Filter: no stopwords, length >= 2
    tokens = [t for t in tokens if t not in stop_words and len(t) >= 2]

    return " ".join(tokens)


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

def analyze(jd_text: str, resume_texts: list[str]) -> list[dict]:
    """
    Score each resume against the job description using TF-IDF + cosine similarity.

    Args:
        jd_text:       Raw job-description text.
        resume_texts:  List of raw resume texts (one per candidate).

    Returns:
        A list of dicts (same order as resume_texts) with keys:
            - score             (float, rounded to 4 dp)
            - matched_keywords  (list[str])
            - missing_keywords  (list[str])
    """
    # Preprocess all documents
    clean_jd = preprocess(jd_text)
    clean_resumes = [preprocess(rt) for rt in resume_texts]

    all_docs = [clean_jd] + clean_resumes

    # Fit TF-IDF on the combined corpus (JD + all resumes)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5_000)
    tfidf_matrix = vectorizer.fit_transform(all_docs)

    # JD vector is index 0; resume vectors are indices 1..n
    jd_vector = tfidf_matrix[0]
    resume_vectors = tfidf_matrix[1:]

    # Cosine similarities: shape (n_resumes, 1)
    similarities = cosine_similarity(jd_vector, resume_vectors)[0]

    # Top-30 JD keywords by TF-IDF weight
    feature_names = vectorizer.get_feature_names_out()
    jd_weights = jd_vector.toarray()[0]
    top_indices = jd_weights.argsort()[::-1][:30]
    jd_keywords: set[str] = {feature_names[i] for i in top_indices if jd_weights[i] > 0}

    results: list[dict] = []
    for i, (clean_resume, sim_score) in enumerate(zip(clean_resumes, similarities)):
        resume_word_set = set(clean_resume.split())

        matched = sorted(jd_keywords & resume_word_set)
        missing = sorted(jd_keywords - resume_word_set)

        results.append(
            {
                "score": round(float(sim_score), 4),
                "matched_keywords": matched,
                "missing_keywords": missing,
            }
        )

    logger.info(
        "Scored %d resumes — top score: %.4f",
        len(results),
        max((r["score"] for r in results), default=0.0),
    )
    return results
