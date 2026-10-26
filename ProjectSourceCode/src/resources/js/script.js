
// Diplomacy Board JavaScript

function selectTerritory(territoryName) {

    // Update the selected territory text
    document.getElementById("selectedTerritory").textContent =
        "Selected Territory: " + territoryName;

    // Show selection in browser console
    console.log("Selected Territory:", territoryName);
}
