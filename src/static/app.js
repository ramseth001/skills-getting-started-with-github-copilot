document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // core info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
        `;

        // participants list container
        const listContainer = document.createElement("div");
        if (details.participants.length) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.textContent = p;

            const btn = document.createElement("button");
            btn.className = "remove-btn";
            btn.title = "Remove participant";
            btn.dataset.email = p;
            btn.dataset.activity = name;
            btn.innerHTML = "&times;";

            li.appendChild(btn);
            ul.appendChild(li);
          });
          listContainer.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "no-participants";
          none.textContent = "None yet";
          listContainer.appendChild(none);
        }
        activityCard.appendChild(listContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // delegate click for remove buttons
      activitiesList.addEventListener("click", async (evt) => {
        const btn = evt.target.closest(".remove-btn");
        if (!btn) return;

        const email = btn.dataset.email;
        const activity = btn.dataset.activity;

        try {
          const res = await fetch(
            `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
            { method: "DELETE" }
          );
          const data = await res.json();
          if (res.ok) {
            messageDiv.textContent = data.message;
            messageDiv.className = "success";
            fetchActivities(); // refresh list
          } else {
            messageDiv.textContent = data.detail || "Failed to remove";
            messageDiv.className = "error";
          }
        } catch (err) {
          messageDiv.textContent = "Network error removing participant";
          messageDiv.className = "error";
          console.error(err);
        }

        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // update cards immediately
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
