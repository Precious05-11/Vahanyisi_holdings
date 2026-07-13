const form = document.getElementById("contactForm");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);

  const data = Object.fromEntries(formData.entries());

  try {
    console.log(data);
    const response = await fetch("/ .netlify/functions/submit-quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert("Thank you! Your request has been sent.");
      form.reset();
    } else {
      console.error("Submission error:", result);
      alert("Something went wrong. Please try again.");
    }
  } catch (error) {
    console.error("Request failed:", error);
    alert("Unable to submit your request. Please try again.");
  }
});
