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
  
  // Match the Google Drive File ID
  const match = url.match(/[-\w]{25,}/);
  
  if (match) {
    return `https://drive.google.com/uc?export=${type}&id=${match[0]}`;
  }
  
  // If it's already a direct link, just return it
  return url;
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

      // ✅ Generate QR code based on Tag ID (unique)
      if (tagID) {
        new QRCode(document.getElementById("qrcode"), {
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
