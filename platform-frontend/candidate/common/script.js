// Notification button handler
document.addEventListener("DOMContentLoaded", () => {
  const notificationBtn = document.getElementById("notificationBtn");

  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      alert("Notifications feature - Coming soon!");
    });
  }

  // Search functionality
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      console.log("Searching for:", e.target.value);
      // Add your search logic here
    });
  }

  // Difficulty filter buttons
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");
  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      difficultyBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const difficulty = this.dataset.difficulty;
      console.log("Filtering by:", difficulty);
      // Add filtering logic here
    });
  });

  // Problem category cards
  const categoryCards = document.querySelectorAll(".category-card");
  categoryCards.forEach((card) => {
    card.addEventListener("click", function () {
      console.log("Category clicked:", this.querySelector("h3").textContent);
      // Navigate to category or show filtered problems
    });
  });
});
