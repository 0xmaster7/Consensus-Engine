// static/js/voting.js

// Called from council.js when a vote_result event arrives
function handleVoteResult(event) {
  const { winner, scores, explanation } = event;

  // Show score badges on each card
  Object.entries(scores).forEach(([expert, score]) => {
    const badge = document.getElementById(`badge-${expert}`);
    if (!badge) return;
    badge.textContent = `${(score * 100).toFixed(1)}% agree`;
    badge.classList.remove("hidden");
    if (expert === winner) badge.classList.add("top-score");
  });

  // Highlight winning card
  if (winner) {
    const winnerCard = document.getElementById(`card-${winner}`);
    if (winnerCard) winnerCard.classList.add("winner");
  }

  // Show the banner
  const banner = document.getElementById("vote-banner");
  const bannerText = document.getElementById("vote-banner-text");
  const modelLabels = {
    mistral: "Mistral 7B",
    llama:   "Llama 3.1",
    qwen:    "Qwen 2.5",
    gemma:   "Gemma 2",
  };
  bannerText.textContent = `🏆 Council consensus: ${modelLabels[winner] || winner} — ${explanation}`;
  banner.classList.remove("hidden");
}
