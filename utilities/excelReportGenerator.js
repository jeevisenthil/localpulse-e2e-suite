const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { logger, getExecutionSteps } = require('./logger');
const config = require('../config/config');

async function generateExcelReport(results) {
  const excelDir = path.join(__dirname, '../excel');
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, { recursive: true });
  }

  const filePath = path.join(excelDir, 'E2E_Report.xlsx');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LocalPulse QA Automation Architect';
  workbook.lastModifiedBy = 'LocalPulse CI/CD Agent';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color Palette Definitions
  const colors = {
    primary: 'FF3F51B5',     // Indigo
    accent: 'FFFFC107',      // Gold
    success: 'FF10B981',     // Emerald
    error: 'FFEF4444',       // Crimson
    warning: 'FFF59E0B',     // Amber
    zebra: 'FFF1F5F9',       // Light slate
    textLight: 'FFFFFFFF',
    textDark: 'FF1E293B',
    border: 'FFE2E8F0'
  };

  // Header Styling Utility
  const styleHeader = (row, colorHex) => {
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorHex }
      };
      cell.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: colors.textLight }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: colors.border } }
      };
    });
    row.height = 28;
  };

  // Border and Font Utility for Data cells
  const styleDataRows = (sheet, startCol, endCol) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber >= startCol && colNumber <= endCol) {
          cell.font = { name: 'Arial', size: 10, color: { argb: colors.textDark } };
          cell.border = {
            top: { style: 'thin', color: { argb: colors.border } },
            left: { style: 'thin', color: { argb: colors.border } },
            bottom: { style: 'thin', color: { argb: colors.border } },
            right: { style: 'thin', color: { argb: colors.border } }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          // Zebra striping
          if (rowNumber % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: colors.zebra }
            };
          }
        }
      });
      row.height = 20;
    });
  };

  // Split tests by suite
  const seleniumTests = results.tests.filter(t => t.module.includes('Selenium') || t.title.includes('TC-SEL-'));
  const appiumTests = results.tests.filter(t => t.module.includes('Appium') || t.title.includes('TC-APP-'));
  const vulnerabilityTests = results.tests.filter(t => t.module.includes('Vulnerability') || t.module.includes('Security') || t.title.includes('TC-SEC-'));
  const loadTests = results.tests.filter(t => t.module.includes('Load') || t.module.includes('Performance') || t.title.includes('TC-LOD-'));

  const suites = [
    { name: 'Selenium Web UI Tests', data: seleniumTests },
    { name: 'Appium Mobile Tests', data: appiumTests },
    { name: 'Vulnerability Tests', data: vulnerabilityTests },
    { name: 'Load / Concurrency Tests', data: loadTests }
  ];

  // ==========================================
  // SHEET 1: SUMMARY
  // ==========================================
  const summarySheet = workbook.addWorksheet('Summary', { views: [{ showGridLines: true }] });
  summarySheet.columns = [
    { header: 'Test Suite Name', key: 'suiteName', width: 30 },
    { header: 'Target Platform', key: 'platform', width: 20 },
    { header: 'Total Tests', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Skipped', key: 'skipped', width: 15 },
    { header: 'Pass Rate', key: 'passRate', width: 15 }
  ];
  styleHeader(summarySheet.getRow(1), colors.primary);

  suites.forEach(suite => {
    const total = suite.data.length;
    const passed = suite.data.filter(t => t.status === 'passed').length;
    const failed = suite.data.filter(t => t.status === 'failed').length;
    const skipped = suite.data.filter(t => t.status === 'skipped').length;
    const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%';
    
    let platform = 'Web Browser';
    if (suite.name.includes('Appium')) platform = 'Android Emulator';
    if (suite.name.includes('Vulnerability')) platform = 'Web API / Forms';
    if (suite.name.includes('Load')) platform = 'HTTP Backend';

    const row = summarySheet.addRow({
      suiteName: suite.name,
      platform,
      total,
      passed,
      failed,
      skipped,
      passRate
    });

    row.getCell('passed').font = { bold: true, color: { argb: 'FF10B981' } };
    row.getCell('failed').font = { bold: true, color: { argb: 'FFEF4444' } };
    row.getCell('passRate').font = { bold: true, color: { argb: 'FF10B981' } };
  });

  // Global metrics summary block
  summarySheet.addRow({});
  summarySheet.addRow({
    suiteName: 'GLOBAL SUMMARY',
    platform: 'All Platforms',
    total: results.total,
    passed: results.passed,
    failed: results.failed,
    skipped: results.skipped,
    passRate: results.total > 0 ? `${((results.passed / results.total) * 100).toFixed(1)}%` : '0.0%'
  });

  const lastRow = summarySheet.lastRow;
  lastRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FF3F51B5' } };
  });
  styleDataRows(summarySheet, 1, 7);

  // Helper function to populate generic test sheets
  const populateTestSheet = (sheetName, testsList, headerColor) => {
    const sheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'Test ID', key: 'id', width: 18 },
      { header: 'Scenario Title', key: 'scenario', width: 65 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Time', key: 'start', width: 22 },
      { header: 'End Time', key: 'end', width: 22 },
      { header: 'Duration', key: 'duration', width: 15 }
    ];
    styleHeader(sheet.getRow(1), headerColor);

    testsList.forEach(t => {
      const row = sheet.addRow({
        id: t.title.split(':')[0].trim(),
        scenario: t.title.split(':').slice(1).join(':').trim() || t.title,
        status: t.status.toUpperCase(),
        start: t.start,
        end: t.end,
        duration: t.duration
      });

      const statusCell = row.getCell('status');
      statusCell.font = { bold: true, color: { argb: t.status === 'passed' ? 'FF10B981' : 'FFEF4444' } };
      statusCell.alignment = { horizontal: 'center' };
    });
    styleDataRows(sheet, 1, 6);
  };

  // Populate dynamic test sheet tabs
  populateTestSheet('Selenium UI Tests', seleniumTests, colors.primary);
  populateTestSheet('Appium Mobile Tests', appiumTests, 'FF009688'); // Teal
  populateTestSheet('Vulnerability Tests', vulnerabilityTests, 'FF9C27B0'); // Purple
  populateTestSheet('Load Tests', loadTests, 'FF00L0FF'); // Blue

  // ==========================================
  // SHEET: FAILED TESTS
  // ==========================================
  const failSheet = workbook.addWorksheet('Failed Tests', { views: [{ showGridLines: true }] });
  failSheet.columns = [
    { header: 'Test Name', key: 'name', width: 40 },
    { header: 'Failure Reason', key: 'reason', width: 60 },
    { header: 'Screenshot Path', key: 'screenshot', width: 50 },
    { header: 'Browser/Driver', key: 'browser', width: 15 },
    { header: 'URL/Endpoint', key: 'url', width: 40 }
  ];
  styleHeader(failSheet.getRow(1), colors.error);

  const failures = results.tests.filter(t => t.status === 'failed');
  failures.forEach(f => {
    failSheet.addRow({
      name: f.title,
      reason: f.error || 'Assertion failed',
      screenshot: f.screenshotPath || 'No screenshot captured',
      browser: config.browserName,
      url: f.url || config.appUrl
    });
  });
  styleDataRows(failSheet, 1, 5);

  // ==========================================
  // SHEET: EXECUTION LOGS
  // ==========================================
  const logSheet = workbook.addWorksheet('Execution Logs', { views: [{ showGridLines: true }] });
  logSheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'Test Name', key: 'testName', width: 35 },
    { header: 'Step Description', key: 'step', width: 55 },
    { header: 'Result', key: 'result', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];
  styleHeader(logSheet.getRow(1), colors.primary);

  const steps = getExecutionSteps();
  steps.forEach(s => {
    const row = logSheet.addRow({
      timestamp: s.timestamp,
      testName: s.testName,
      step: s.stepDescription,
      result: s.result,
      remarks: s.remarks
    });

    const resCell = row.getCell('result');
    resCell.font = { bold: true, color: { argb: s.result === 'PASS' ? 'FF10B981' : 'FFEF4444' } };
    resCell.alignment = { horizontal: 'center' };
  });
  styleDataRows(logSheet, 1, 5);

  // Write Excel file
  await workbook.xlsx.writeFile(filePath);
  logger.info(`Excel E2E Report saved successfully: [${filePath}]`);
}

module.exports = { generateExcelReport };
