/**
 * Receives wishes from the birthday invite and appends them to the first tab
 * of the configured spreadsheet.
 *
 * Deploy as: Web app
 * Execute as: Me
 * Who has access: Anyone
 */
const SPREADSHEET_ID = '1KrwrIyabuhukj6596yRPktRquVULfzdriLmCuraUVoo';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  const data = (e && e.parameter) || {};

  if (!data.wish || !String(data.wish).trim()) {
    return json_({ ok: false, error: 'wish is required' });
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Wish', 'Name', 'Source']);
  }

  sheet.appendRow([
    new Date(),
    String(data.wish).trim(),
    String(data.name || '').trim(),
    String(data.source || '').trim()
  ]);

  return json_({ ok: true });
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
