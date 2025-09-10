// ✅ Google Sheets API URL
const sheetUrl =
  "https://sheets.googleapis.com/v4/spreadsheets/1wRVwI8zpw3S9QMUI5jVdunp4C5E5o_YFFLJGcN5XnDk/values/Form%20responses%201?key=AIzaSyB1cM1ShT5Q_QFfrGehNVHVA9cLkOyU7pU";

// ✅ Helper: Convert Google Drive links to direct links
const getDriveDirectLink = (url, type = "view") => {
  if (!url) return "";
  const match = url.match(/[-\w]{25,}/);
  return match
    ? `https://drive.google.com/uc?export=${type}&id=${match[0]}`
    : url;
};

// ✅ Main search function
async function searchData(queryOverride = null) {
  const query =
    queryOverride || document.getElementById("searchInput").value.toLowerCase();
  const resultDiv = document.getElementById("result");

  try {
    const response = await fetch(sheetUrl);
    const result = await response.json();
    const rows = result.values;

    if (!rows || rows.length === 0) {
      resultDiv.innerHTML = "<p>No data found in sheet.</p>";
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase());

    const worker = rows.slice(1).find((row) => {
      const tagIdIndex = headers.indexOf("tag id");
      const surnameIndex = headers.indexOf("surname");
      return (
        (tagIdIndex >= 0 &&
          row[tagIdIndex]?.toLowerCase().trim() === query) ||
        (surnameIndex >= 0 &&
          row[surnameIndex]?.toLowerCase().trim() === query)
      );
    });

    if (worker) {
      const getValue = (field) => {
        const idx = headers.indexOf(field.toLowerCase());
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
            <div class="form-field"><label>NIN/PASSPORT:</label> ${getValue("nin/passport id")}</div>
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
            <img src="${getDriveDirectLink(getValue("upload your passport photograph"), "view")}" 
                alt="Passport Photo" width="120">
            <br>
            <a href="${getDriveDirectLink(getValue("upload your nin/passport card/slip"), "download")}" 
                target="_blank">View NIN/PASSPORT</a>
            <div id="qrcode"></div>
          </div>
        </div>
      `;

      // ✅ Generate QR code for Tag ID
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
    resultDiv.innerHTML = "<p>Error loading data.</p>";
  }
}

// ✅ Trigger search on Enter key
document
  .getElementById("searchInput")
  .addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      searchData();
    }
  });

// ✅ QR Scanner Setup
let html5QrCode;

function startScanner() {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }

  html5QrCode
    .start(
      { facingMode: "environment" }, // back camera
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        document.getElementById("searchInput").value = decodedText;
        searchData(decodedText); // auto search
        stopScanner(); // stop after scanning one QR
      }
    )
    .catch((err) => {
      console.error("Scanner start error:", err);
    });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().catch((err) => console.error("Stop error:", err));
  }
}

// ✅ Attach buttons
document
  .getElementById("startScanBtn")
  .addEventListener("click", startScanner);
document.getElementById("stopScanBtn").addEventListener("click", stopScanner);
