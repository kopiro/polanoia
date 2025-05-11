// Helper function to format dates in style (DD/MM/YYYY HH:MM)
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Helper function to format dates for datetime-local input (YYYY-MM-DDThh:mm)
function formatDateForInput(date) {
  return date.toISOString().slice(0, 16);
}

// Helper function to convert date string to Date object
function parseDate(dateStr) {
  // Expected format: DD/MM/YYYY HH:MM
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("/");
  const [hours, minutes] = timePart ? timePart.split(":") : ["00", "00"];

  // Create a date object with the parsed values
  // Note: month is 0-indexed in JavaScript Date constructor
  const date = new Date(year, month - 1, day, hours, minutes);

  // Validate the date is valid
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return date;
}

// Helper function to get Bootstrap icon class based on status
function getStatusIconClass(status) {
  switch (status) {
    case "Completed":
      return "bi bi-check-circle-fill text-success";
    case "Pending":
      return "bi bi-hourglass-split text-warning";
    case "Failed":
      return "bi bi-x-circle-fill text-danger";
    case "Modified":
      return "bi bi-exclamation-triangle-fill text-warning";
    default:
      return "bi bi-question-circle-fill text-secondary";
  }
}

// Function to show Bootstrap alert
function showAlert(message, type = "info") {
  const alertContainer =
    document.getElementById("alert-container") || createAlertContainer();

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute("role", "alert");

  alertDiv.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close";
  closeButton.setAttribute("data-bs-dismiss", "alert");
  closeButton.setAttribute("aria-label", "Close");

  alertDiv.appendChild(closeButton);
  alertContainer.appendChild(alertDiv);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.classList.remove("show");
    setTimeout(() => alertDiv.remove(), 150);
  }, 5000);
}

// Function to create alert container if it doesn't exist
function createAlertContainer() {
  const container = document.createElement("div");
  container.id = "alert-container";
  container.className = "position-fixed top-0 end-0 p-3";
  container.style.zIndex = "1050";
  document.body.appendChild(container);
  return container;
}

// Function to populate form with trip data
function populateFormWithTripData(trip) {
  const form = document.getElementById("itineraryForm");
  const tripTypeSelect = document.getElementById("trip_type");
  const startDateInput = document.getElementById("start_date");
  const endDateInput = document.getElementById("end_date");
  const startPlaceInput = document.getElementById("start_place");
  const endPlaceInput = document.getElementById("end_place");
  const tripFocusInput = document.getElementById("trip_focus");
  const tripNotesInput = document.getElementById("trip_notes");
  const identifierInput = document.getElementById("identifier");

  // Format dates for the inputs
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);

  // Set the form values
  tripTypeSelect.value = trip.trip_type;
  startDateInput.value = formatDate(startDate);
  endDateInput.value = formatDate(endDate);
  startPlaceInput.value = trip.start_place;
  endPlaceInput.value = trip.end_place;
  tripFocusInput.value = trip.trip_focus;
  tripNotesInput.value = trip.trip_notes || "";
  identifierInput.value = trip.identifier;

  // Update Flatpickr instances if they exist
  if (startDateInput._flatpickr) {
    startDateInput._flatpickr.setDate(startDate);
  }

  if (endDateInput._flatpickr) {
    endDateInput._flatpickr.setDate(endDate);
  }

  // Update format display
  const startDateContainer = document.getElementById("start_date");
  const endDateContainer = document.getElementById("end_date");

  if (startDateContainer) {
    startDateContainer.textContent = formatDate(startDate);
  }

  if (endDateContainer) {
    endDateContainer.textContent = formatDate(endDate);
  }

  // Add a hidden input for the trip ID
  let tripIdInput = document.getElementById("trip_id");
  if (!tripIdInput) {
    tripIdInput = document.createElement("input");
    tripIdInput.type = "hidden";
    tripIdInput.id = "trip_id";
    tripIdInput.name = "trip_id";
    form.appendChild(tripIdInput);
  }
  tripIdInput.value = trip.id;

  // Change the submit button text
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = "Update Trip";
}

// Function to create content display elements
function createContentDisplayElements(trip) {
  const resultElement = document.getElementById("result");
  resultElement.innerHTML = "";

  // Create a header container
  const headerContainer = document.createElement("div");
  headerContainer.className =
    "d-flex justify-content-between align-items-center alert alert-info mb-3";

  // Add the view/edit mode text to the left side
  const modeNote = document.createElement("div");
  modeNote.innerHTML = '<i class="bi bi-eye"></i> Viewing mode';
  headerContainer.appendChild(modeNote);

  // Create buttons container for the right side
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "d-flex gap-2";

  // Add edit button
  const editButton = document.createElement("button");
  editButton.className = "btn btn-primary btn-sm";
  editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit Content';

  // Add save button (initially hidden)
  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-success btn-sm d-none";
  saveButton.innerHTML = '<i class="bi bi-save"></i> Save Changes';

  // Create a container for the content
  const contentContainer = document.createElement("div");
  contentContainer.className = "content-container";

  // Check if the trip is still pending
  if (trip.status === "Pending") {
    // If pending, show a message and lock the content
    contentContainer.innerHTML = `
      <div class="alert alert-warning text-center p-5">
        <i class="bi bi-hourglass-split fs-1"></i>
        <h3 class="mt-3">Generation Pending</h3>
        <p>This trip is still being generated. Please check back later.</p>
        <div class="mt-3">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span class="ms-2">Processing...</span>
        </div>
      </div>
    `;

    // Disable the edit button
    editButton.disabled = true;
    editButton.title = "Content is still being generated";

    // Start polling for status updates
    checkTripStatusWithPolling(trip.id);
  } else {
    // If not pending, show the content
    contentContainer.innerHTML = trip.html_content;

    // Add event listeners for editing
    editButton.addEventListener("click", () => {
      contentContainer.setAttribute("contenteditable", "true");
      contentContainer.focus();
      editButton.classList.add("d-none");
      saveButton.classList.remove("d-none");
      modeNote.innerHTML = '<i class="bi bi-pencil"></i> Editing mode';
    });

    saveButton.addEventListener("click", async () => {
      await saveTripContent(trip.id, contentContainer.innerHTML);
      contentContainer.setAttribute("contenteditable", "false");
      saveButton.classList.add("d-none");
      editButton.classList.remove("d-none");
      modeNote.innerHTML = '<i class="bi bi-eye"></i> Viewing mode';
    });
  }

  // Add buttons to the container
  buttonsContainer.appendChild(editButton);
  buttonsContainer.appendChild(saveButton);
  headerContainer.appendChild(buttonsContainer);

  // Add the header to the result element
  resultElement.appendChild(headerContainer);

  // Add the content container
  resultElement.appendChild(contentContainer);

  // Scroll to the form
  document
    .getElementById("itineraryForm")
    .scrollIntoView({ behavior: "smooth" });
}

// Function to display trip content
function displayTripContent(trip) {
  const resultElement = document.getElementById("result");

  // Clear previous content
  resultElement.innerHTML = "";

  // Create a container for the HTML content with full width
  const contentContainer = document.createElement("div");
  contentContainer.className = "trip-content w-100";

  // Check if the trip has HTML content
  if (trip.html_content) {
    contentContainer.innerHTML = trip.html_content;
  } else {
    // If no HTML content, show a message
    contentContainer.innerHTML = `
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill"></i> No content available for this trip.
      </div>
    `;
  }

  // Append the content to the result element
  resultElement.appendChild(contentContainer);

  // Scroll to the result element
  resultElement.scrollIntoView({ behavior: "smooth" });

  // Return the content container for potential further manipulation
  return contentContainer;
}

// Function to load trips
async function loadTrips() {
  try {
    const response = await fetch("/trips");
    const trips = await response.json();

    const tripsList = document.getElementById("trips-list");
    tripsList.innerHTML = "";

    // Create table structure
    const table = document.createElement("table");
    table.className = "table table-striped table-hover";

    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Define table headers - moved Status to the beginning
    const headers = [
      "Status",
      "Identifier",
      "From",
      "To",
      "Created",
      "Actions",
    ];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement("tbody");

    trips.forEach((trip) => {
      const row = document.createElement("tr");
      row.setAttribute("data-trip-id", trip.id);

      // Format dates using style
      const startDate = formatDate(new Date(trip.start_date));
      const endDate = formatDate(new Date(trip.end_date));

      // Status - moved to the beginning and centered
      const statusCell = document.createElement("td");
      statusCell.className = "text-center";
      const statusIcon = document.createElement("i");
      statusIcon.className = getStatusIconClass(trip.status);
      statusIcon.setAttribute("title", trip.status || "Pending");
      statusCell.appendChild(statusIcon);

      // Add a warning badge for modified trips
      if (trip.status === "Modified") {
        const warningBadge = document.createElement("span");
        warningBadge.className = "badge status-modified ms-1";
        warningBadge.textContent = "Modified";
        statusCell.appendChild(warningBadge);
      }

      row.appendChild(statusCell);

      // Identifier
      const identifierCell = document.createElement("td");
      identifierCell.textContent = trip.identifier;
      row.appendChild(identifierCell);

      // From
      const fromCell = document.createElement("td");
      fromCell.textContent = `${trip.start_place} (${startDate})`;
      row.appendChild(fromCell);

      // To
      const toCell = document.createElement("td");
      toCell.textContent = `${trip.end_place} (${endDate})`;
      row.appendChild(toCell);

      // Created
      const createdCell = document.createElement("td");
      createdCell.textContent = trip.created_at;
      row.appendChild(createdCell);

      // Actions
      const actionsCell = document.createElement("td");
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "trip-actions";

      // Add buttons based on status
      // View button (merged with edit functionality)
      const viewButton = document.createElement("button");
      viewButton.className = "btn btn-xs btn-primary me-2";
      viewButton.innerHTML = '<i class="bi bi-eye"></i> View';
      viewButton.addEventListener("click", () => viewTrip(trip.id));
      actionsContainer.appendChild(viewButton);

      // Regenerate button
      const regenerateButton = document.createElement("button");
      regenerateButton.className = "btn btn-xs btn-warning me-2 regenerate-btn";
      regenerateButton.innerHTML =
        '<i class="bi bi-arrow-clockwise"></i> Regenerate';
      regenerateButton.setAttribute("data-trip-id", trip.id);
      regenerateButton.addEventListener("click", () => regenerateTrip(trip.id));
      actionsContainer.appendChild(regenerateButton);

      // Add delete button for all trips
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-xs btn-danger";
      deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
      deleteButton.addEventListener("click", () => deleteTrip(trip.id));
      actionsContainer.appendChild(deleteButton);

      actionsCell.appendChild(actionsContainer);
      row.appendChild(actionsCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tripsList.appendChild(table);
  } catch (error) {
    console.error("Error loading trips:", error);
    showAlert("Failed to load trips. Please try again.", "danger");
  }
}

// Function to view a trip
async function viewTrip(tripId) {
  try {
    // First, fetch the trip details to populate the form
    const response = await fetch(`/trips/${tripId}`);
    const trip = await response.json();

    if (trip.error) {
      showAlert(trip.error, "danger");
      return;
    }

    // Populate the form with trip details
    populateFormWithTripData(trip);

    // Create content display elements
    createContentDisplayElements(trip);

    // Show a message that we're in view/edit mode
    showAlert(
      "Viewing trip details. You can edit the form and content.",
      "info"
    );
  } catch (error) {
    console.error("Error viewing trip:", error);
    showAlert("Failed to load trip content. Please try again.", "danger");
  }
}

// Function to save edited trip content
async function saveTripContent(tripId, htmlContent) {
  try {
    const response = await fetch(`/trips/${tripId}/content`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html_content: htmlContent }),
    });

    const data = await response.json();

    if (data.error) {
      showAlert(data.error, "danger");
      return;
    }

    showAlert("Trip content saved successfully", "success");

    // Refresh the trips list to update the status
    await loadTrips();
  } catch (error) {
    console.error("Error saving trip content:", error);
    showAlert("Failed to save trip content. Please try again.", "danger");
  }
}

// Function to check trip status with polling
async function checkTripStatusWithPolling(tripId) {
  try {
    // Show loading indicator in the status cell
    const statusCell = document.querySelector(
      `tr[data-trip-id="${tripId}"] td:first-child`
    );
    if (statusCell) {
      // Create hourglass icon
      const hourglassIcon = document.createElement("i");
      hourglassIcon.className = "bi bi-hourglass-split text-warning";

      // Create spinner span
      const spinnerSpan = document.createElement("span");
      spinnerSpan.className = "spinner-border spinner-border-sm";
      spinnerSpan.setAttribute("role", "status");
      spinnerSpan.setAttribute("aria-hidden", "true");
      hourglassIcon.appendChild(spinnerSpan);

      // Create polling time span
      const pollingTimeSpan = document.createElement("span");
      pollingTimeSpan.className = "polling-time ms-1";
      pollingTimeSpan.textContent = "(0s)";

      // Clear and append new elements
      statusCell.innerHTML = "";
      statusCell.appendChild(hourglassIcon);
      statusCell.appendChild(pollingTimeSpan);
    }

    // Initialize polling intervals if it doesn't exist
    if (!window.pollingIntervals) {
      window.pollingIntervals = {};
    }

    // Start polling
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/trips/${tripId}`);
        const trip = await response.json();

        if (trip.error) {
          clearInterval(pollInterval);
          showAlert(trip.error, "danger");
          return;
        }

        // Add the polling time if still polling
        if (trip.status === "Pending") {
          if (statusCell) {
            const elapsedSeconds = Math.floor(
              (Date.now() - window.pollingIntervals[tripId].at) / 1000
            );
            // Check if polling time element already exists
            let pollingTimeSpan = statusCell.querySelector(".polling-time");
            if (pollingTimeSpan) {
              pollingTimeSpan.textContent = `(${elapsedSeconds}s)`;
            }
          }
        }

        if (trip.status === "Completed") {
          // Trip is ready, stop polling and show the content
          clearInterval(pollInterval);

          // Display the HTML content
          displayTripContent(trip);

          // Refresh the trips list to update the status
          await loadTrips();
        } else if (trip.status === "Failed") {
          // Trip generation failed, stop polling
          clearInterval(pollInterval);

          showAlert("Trip generation failed. Please try again.", "danger");
          await loadTrips(); // Refresh the trips list
        }
      } catch (error) {
        console.error("Error checking trip status:", error);
        clearInterval(pollInterval);
        showAlert("Failed to check trip status. Please try again.", "danger");
      }
    }, 1000); // Poll every 1 seconds

    // Store the interval ID
    window.pollingIntervals[tripId] = {
      intv: pollInterval,
      at: Date.now(),
    };
  } catch (error) {
    console.error("Error setting up polling:", error);
    showAlert("Failed to set up status checking. Please try again.", "danger");
  }
}

// Function to edit a trip
async function editTrip(tripId) {
  try {
    // Fetch the trip details from the trips endpoint
    const response = await fetch(`/trips/${tripId}`);
    const trip = await response.json();

    if (trip.error) {
      showAlert(trip.error, "danger");
      return;
    }

    // Populate the form with trip details
    populateFormWithTripData(trip);

    // Scroll to the form
    document
      .getElementById("itineraryForm")
      .scrollIntoView({ behavior: "smooth" });

    // Show a message that we're in edit mode
    showAlert(
      "Editing trip. Fill in the form and click 'Update Trip' to save changes.",
      "info"
    );
  } catch (error) {
    console.error("Error editing trip:", error);
    showAlert(
      "Failed to load trip details for editing. Please try again.",
      "danger"
    );
  }
}

// Load past trips when the page loads
document.addEventListener("DOMContentLoaded", () => {
  loadTrips();

  // Initialize Flatpickr date pickers with format
  const datePickers = document.querySelectorAll(".datepicker");
  if (datePickers.length > 0) {
    datePickers.forEach((picker) => {
      flatpickr(picker, {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        locale: {
          firstDayOfWeek: 1, // Monday
          formatDate: (date, format, locale) => {
            // Ensure the date is formatted correctly for the backend
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");

            return `${day}/${month}/${year} ${hours}:${minutes}`;
          },
        },
      });
    });
  }

  // Add event listeners to date inputs to show format
  const startDateInput = document.getElementById("start_date");
  const endDateInput = document.getElementById("end_date");

  if (startDateInput && endDateInput) {
    // Create containers for displaying format dates
    const startDateContainer = document.createElement("div");
    startDateContainer.className = "form-text mt-1";
    startDateContainer.id = "start_date";
    startDateInput.parentNode.appendChild(startDateContainer);

    const endDateContainer = document.createElement("div");
    endDateContainer.className = "form-text mt-1";
    endDateContainer.id = "end_date";
    endDateInput.parentNode.appendChild(endDateContainer);

    // Update format display when date inputs change
    startDateInput.addEventListener("change", () => {
      if (startDateInput.value) {
        const date = new Date(startDateInput.value);
        startDateContainer.textContent = formatDate(date);
      } else {
        startDateContainer.textContent = "";
      }
    });

    endDateInput.addEventListener("change", () => {
      if (endDateInput.value) {
        const date = new Date(endDateInput.value);
        endDateContainer.textContent = formatDate(date);
      } else {
        endDateContainer.textContent = "";
      }
    });
  }
});

// Update the form submission handler to handle both create and update
document
  .getElementById("itineraryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const result = document.getElementById("result");
    result.innerHTML = "";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Check if we're updating an existing trip
    const tripId = data.trip_id;
    const isUpdate = !!tripId;

    // Remove trip_id from the data to be sent
    delete data.trip_id;

    // Convert date format to ISO format for the backend
    try {
      if (data.start_date) {
        const startDate = parseDate(data.start_date);
        data.start_date = startDate.toISOString();
      }

      if (data.end_date) {
        const endDate = parseDate(data.end_date);
        data.end_date = endDate.toISOString();
      }
    } catch (error) {
      showAlert(
        `Date format error: ${error.message}. Please use the date picker to select dates.`,
        "danger"
      );
      return;
    }

    try {
      let response;

      if (isUpdate) {
        // Update existing trip
        response = await fetch(`/trips/${tripId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const resultData = await response.json();

        if (response.ok) {
          // Show success message
          showAlert("Trip updated successfully", "success");

          // Reset the form
          e.target.reset();

          // Change the submit button text back
          const submitButton = e.target.querySelector('button[type="submit"]');
          submitButton.textContent = "Generate Itinerary";

          // Remove the trip_id input
          const tripIdInput = document.getElementById("trip_id");
          if (tripIdInput) {
            tripIdInput.remove();
          }

          // Refresh the trips list
          await loadTrips();

          // Start polling for status updates
          checkTripStatusWithPolling(tripId);
        } else {
          showAlert(resultData.error, "danger");
        }
      } else {
        // Create new trip
        response = await fetch("/trips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const resultData = await response.json();

        if (response.ok) {
          // Clear previous content
          result.innerHTML = "";

          // Show a message that the trip is being generated
          const messageContainer = document.createElement("div");
          messageContainer.className = "alert alert-info";
          messageContainer.textContent =
            "Your trip is being generated. You can view its status in the Past Trips section below.";
          result.appendChild(messageContainer);

          // Refresh the trips list to show the new trip
          await loadTrips();

          // Start polling for status updates
          checkTripStatusWithPolling(resultData.trip_id);
        } else {
          showAlert(resultData.error, "danger");
        }
      }
    } catch (error) {
      showAlert(`An error occurred: ${error.message}`, "danger");
    }
  });

// Function to delete a trip
async function deleteTrip(tripId) {
  if (
    !confirm(
      "Are you sure you want to delete this trip? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/trips/${tripId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.error) {
      showAlert(data.error, "danger");
      return;
    }

    // Show success message
    showAlert("Trip deleted successfully", "success");

    // Refresh the trips list
    await loadTrips();

    // Clear the result area if the deleted trip was being viewed
    const resultElement = document.getElementById("result");
    resultElement.innerHTML = "";
  } catch (error) {
    console.error("Error deleting trip:", error);
    showAlert("Failed to delete trip. Please try again.", "danger");
  }
}

// Function to regenerate a trip
async function regenerateTrip(tripId) {
  try {
    // Find the regenerate button and disable it
    const regenerateButton = document.querySelector(
      `button[data-trip-id="${tripId}"].regenerate-btn`
    );
    if (regenerateButton) {
      regenerateButton.disabled = true;

      // Add spinner to the button
      const originalText = regenerateButton.innerHTML;
      regenerateButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Regenerating...
      `;

      // Store the original text to restore it later
      regenerateButton.dataset.originalText = originalText;
    }

    // Use the new dedicated regenerate endpoint
    const response = await fetch(`/trips/${tripId}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Restore the button state
    if (regenerateButton) {
      regenerateButton.disabled = false;
      regenerateButton.innerHTML =
        regenerateButton.dataset.originalText ||
        '<i class="bi bi-arrow-clockwise"></i> Regenerate';
    }

    if (data.error) {
      showAlert(data.error, "danger");
      return;
    }

    showAlert("Trip is being regenerated. Please check back later.", "info");
    checkTripStatusWithPolling(tripId);
  } catch (error) {
    // Restore the button state in case of error
    const regenerateButton = document.querySelector(
      `button[data-trip-id="${tripId}"].regenerate-btn`
    );
    if (regenerateButton) {
      regenerateButton.disabled = false;
      regenerateButton.innerHTML =
        regenerateButton.dataset.originalText ||
        '<i class="bi bi-arrow-clockwise"></i> Regenerate';
    }

    console.error("Error regenerating trip:", error);
    showAlert("Failed to regenerate trip. Please try again.", "danger");
  }
}
