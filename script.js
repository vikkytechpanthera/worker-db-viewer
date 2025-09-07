async function searchData() {
  const query = document.getElementById('searchInput').value.toLowerCase();

  const sheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/1wRVwI8zpw3S9QMUI5jVdunp4C5E5o_YFFLJGcN5XnDk/values/'Form responses 1'?key=AIzaSyB1cM1ShT5Q_QFfrGehNVHVA9cLkOyU7pU";

  try {
    const response = await fetch(sheetUrl);
    const result = await response.json();

    const rows = result.values;
    if (!rows || rows.length === 0) {
      document.getElementById('result').innerHTML = "<p>No data found in sheet.</p>";
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase());

    const worker = rows.slice(1).find(row => {
      const tagIdIndex = headers.indexOf("tag id");
      const surnameIndex = headers.indexOf("surname");
      return (
        (tagIdIndex >= 0 && row[tagIdIndex]?.toLowerCase() === query) ||
        (surnameIndex >= 0 && row[surnameIndex]?.toLowerCase() === query)
      );
    });

    // ✅ Helper for Google Drive links
    const getDriveDirectLink = (url, type = "view") => {
      if (!url) return "";
      const match = url.match(/[-\w]{25,}/);
      return match ? `https://drive.google.com/uc?export=${type}&id=${match[0]}` : url;
    };

    const resultDiv = document.getElementById('result');
    if (worker) {
      const getValue = (field) => {
        const idx = headers.indexOf(field.toLowerCase());
        return idx >= 0 ? worker[idx] || "" : "";
      };

      const tagID = getValue("Tag ID");

      resultDiv.innerHTML = `
        <div class="profile-card">
          <div class="profile-info">
            <div class="form-field"><label>Tag ID:</label> ${tagID}</div>
            <div class="form-field"><label>Surname:</label> ${getValue("Surname")}</div>
            <div class="form-field"><label>First Name:</label> ${getValue("First name")}</div>
            <div class="form-field"><label>Middle Name:</label> ${getValue("Middle name")}</div>
            <div class="form-field"><label>Phone:</label> ${getValue("Phone number")}</div>
            <div class="form-field"><label>Address:</label> ${getValue("Address")}</div>
            <div class="form-field"><label>NIN:</label> ${getValue("NIN")}</div>
            <div class="form-field"><label>State of Origin:</label> ${getValue("State of origin")}</div>
            <div class="form-field"><label>Date of Birth:</label> ${getValue("Date of birth")}</div>
            <div class="form-field"><label>Work Category:</label> ${getValue("Work category")}</div>
            <div class="form-field"><label>Site Allocation:</label> ${getValue("Site Allocation")}</div>
            <div class="form-field"><label>Reference Person:</label> ${getValue("Reference person name")} (${getValue("Reference person number")})</div>
            <div class="form-field"><label>Next of Kin:</label> ${getValue("Next of kin")} - ${getValue("Next of kin’s contact")} (${getValue("Next of kin’s relationship")})</div>
            <div class="form-field"><label>Workmen on Site:</label> ${getValue("Numbers of workmen on site")}</div>
          </div>
          <div class="media">
            <img src="${getDriveDirectLink(getValue("Upload Your Passport Photograph"), 'view')}" 
                alt="Passport Photo" width="120">
            <br>
            <a href="${getDriveDirectLink(getValue("NIN PDF Link"), 'download')}" 
                target="_blank">View NIN PDF</a>
            <div id="qrcode"></div>
          </div>
        </div>
      `;

      // ✅ Clear old QR codes before generating a new one
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
  }
}

/* ---------------- QR SCANNER ---------------- */
let html5QrCode;

function startScanner() {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }

  const qrConfig = { fps: 10, qrbox: 250 };

  if (html5QrCode.isScanning) {
    console.log("Scanner already running.");
    return;
  }

  html5QrCode.start(
    { facingMode: "environment" },
    qrConfig,
    qrCodeMessage => {
      console.log("QR Code detected:", qrCodeMessage);
      document.getElementById("searchInput").value = qrCodeMessage;
      searchData();
      stopScanner(); // auto-stop after success
    }
  ).catch(err => {
    console.error("Unable to start scanning:", err);
  });
}


function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      console.log("Scanner stopped.");
    }).catch(err => {
      console.error("Error stopping scanner:", err);
    });
  } else {
    console.log("Scanner is not running, nothing to stop.");
  }
}


// ✅ Bind buttons after DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startScanBtn").addEventListener("click", startScanner);
  document.getElementById("stopScanBtn").addEventListener("click", stopScanner);
});
// ✅ Initial search on page load if input has value