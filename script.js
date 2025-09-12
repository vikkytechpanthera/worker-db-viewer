/* ---------------- SEARCH FUNCTION ---------------- */
async function searchData() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) return;

  showLoader(); // ✅ show loader while fetching

  const sheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/1wRVwI8zpw3S9QMUI5jVdunp4C5E5o_YFFLJGcN5XnDk/values/'Form responses 1'?key=AIzaSyB1cM1ShT5Q_QFfrGehNVHVA9cLkOyU7pU";

  try {
    const response = await fetch(sheetUrl);
    const result = await response.json();

    const rows = result.values;
    if (!rows || rows.length === 0) {
      document.getElementById('result').innerHTML = "<p>No data found in sheet.</p>";
      hideLoader();
      return;
    }

    // Normalize headers
    const headers = rows[0].map(h => h.trim().toLowerCase());

    // Find worker
    const worker = rows.slice(1).find(row => {
      const tagIdIndex = headers.indexOf("tag id");
      const surnameIndex = headers.indexOf("surname");
      return (
        (tagIdIndex >= 0 && row[tagIdIndex]?.toLowerCase() === query) ||
        (surnameIndex >= 0 && row[surnameIndex]?.toLowerCase() === query)
      );
    });

    // Helper for Google Drive links
    const getDriveDirectLink = (url, type = "view") => {
      if (!url) return "";
      if (url.includes("open?id=")) {
        const id = url.split("open?id=")[1];
        return `https://drive.google.com/uc?export=${type}&id=${id}`;
      }
      const match = url.match(/[-\w]{25,}/);
      return match ? `https://drive.google.com/uc?export=${type}&id=${match[0]}` : url;
    };

    const resultDiv = document.getElementById('result');

    if (worker) {
      const getValue = (field) => {
        const idx = headers.indexOf(field.trim().toLowerCase());
        return idx >= 0 ? worker[idx] || "" : "";
      };

      const tagID = getValue("tag id");

      resultDiv.innerHTML = `
        <div class="profile-card">
          <div class="profile-info">
            <div class="form-field"><label>Tag ID:</label> ${tagID}</div>
            <div class="form-field"><label>Surname:</label> ${getValue("surname")}</div>
            <div class="form-field"><label>First Name:</label> ${getValue("first name")}</div>
            <div class="form-field"><label>Middle Name:</label> ${getValue("middle name")}</div>
            <div class="form-field"><label>Phone:</label> ${getValue("phone number")}</div>
            <div class="form-field"><label>Address:</label> ${getValue("address")}</div>
            <div class="form-field"><label>NIN:</label> ${getValue("nin/passport id")}</div>
            <div class="form-field"><label>State of Origin:</label> ${getValue("state of origin")}</div>
            <div class="form-field"><label>Date of Birth:</label> ${getValue("date of birth")}</div>
            <div class="form-field"><label>Work Category:</label> ${getValue("work category")}</div>
            <div class="form-field"><label>Site Allocation:</label> ${getValue("site allocation")}</div>
            <div class="form-field"><label>Reference Person:</label> ${getValue("reference person name")} (${getValue("reference person number")})</div>
            <div class="form-field"><label>Next of Kin:</label> ${getValue("next of kin")} - ${getValue("next of kin's contact")} (${getValue("next of kin's relationship")})</div>
            <div class="form-field"><label>Workmen on Site:</label> ${getValue("number of workmen on site")}</div>
            <div class="form-field"><label>Position:</label> ${getValue("position")}</div>
          </div>
          <div class="media">
            <img src="${getDriveDirectLink(getValue("upload your passport photograph"), 'view')}" 
                alt="Passport Photo" width="120">
            <br>
            <a href="${getDriveDirectLink(getValue("upload your nin/passport card/slip"), 'download')}" 
                target="_blank">View NIN PDF</a>
            <div id="qrcode"></div>
          </div>
        </div>
      `;

      // ✅ Generate QR code
      const qrDiv = document.getElementById("qrcode");
      qrDiv.innerHTML = "";
      if (tagID) {
        new QRCode(qrDiv, {
          text: tagID,
          width: 128,
          height: 128,
        });
      }
    } else {
      resultDiv.innerHTML = "<p>No record found.</p>";
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById('result').innerHTML = "<p>Error loading data.</p>";
  } finally {
    hideLoader(); // ✅ always hide loader
  }
}

/* ---------------- LOADER FUNCTIONS ---------------- */
function showLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "flex";
  setTimeout(() => loader.classList.add("show"), 10);
}

function hideLoader() {
  const loader = document.getElementById("loader");
  loader.classList.remove("show");
  setTimeout(() => loader.style.display = "none", 400);
}

/* ---------------- QR SCANNER ---------------- */
let html5QrCode;
let isScanning = false;

function startScanner() {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }

  if (isScanning) {
    console.log("Scanner already running.");
    return;
  }

  const qrConfig = { fps: 10, qrbox: 250 };

  html5QrCode.start(
    { facingMode: "environment" },
    qrConfig,
    qrCodeMessage => {
      console.log("QR Code detected:", qrCodeMessage);
      document.getElementById("searchInput").value = qrCodeMessage;
      searchData();
      stopScanner(); // ✅ immediately stop after reading
    }
  ).then(() => {
    isScanning = true;
  }).catch(err => {
    console.error("Unable to start scanning:", err);
  });
}

function stopScanner() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      console.log("Scanner stopped.");
      isScanning = false;
    }).catch(err => {
      console.error("Error stopping scanner:", err);
    });
  }
}


/* ---------------- EVENT BINDINGS ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startScanBtn").addEventListener("click", startScanner);
  document.getElementById("stopScanBtn").addEventListener("click", stopScanner);

  // ✅ Search with Enter key
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchData();
    }
  });
});
