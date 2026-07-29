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
    primary: 'FF3F51B5', // Indigo
    accent: 'FFFFC107',  // Gold
    success: 'FF10B981', // Emerald
    error: 'FFEF4444',   // Crimson
    warning: 'FFF59E0B', // Amber
    zebra: 'FFF1F5F9',   // Light slate
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

  // ==========================================
  // SHEET 1: SUMMARY
  // ==========================================
  const summarySheet = workbook.addWorksheet('Summary', { views: [{ showGridLines: true }] });
  summarySheet.columns = [
    { header: 'Execution Date', key: 'execDate', width: 22 },
    { header: 'Environment', key: 'env', width: 15 },
    { header: 'Total Tests', key: 'total', width: 12 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Skipped', key: 'skipped', width: 12 },
    { header: 'Pass Percentage', key: 'passRate', width: 18 },
    { header: 'Execution Duration', key: 'duration', width: 20 }
  ];
  
  styleHeader(summarySheet.getRow(1), colors.primary);

  const total = results.total || 0;
  const passed = results.passed || 0;
  const failed = results.failed || 0;
  const skipped = results.skipped || 0;
  const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%';
  const duration = results.duration || '0s';

  summarySheet.addRow({
    execDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    env: 'QA-LocalSimulator',
    total,
    passed,
    failed,
    skipped,
    passRate,
    duration
  });

  // Apply colors to Passed/Failed values in summary
  summarySheet.eachRow((row, rowNum) => {
    if (rowNum > 1) {
      row.getCell('passed').font = { bold: true, color: { argb: 'FF10B981' } };
      row.getCell('failed').font = { bold: true, color: { argb: 'FFEF4444' } };
      row.getCell('passRate').font = { bold: true, color: { argb: passed === total ? 'FF10B981' : 'FFF59E0B' } };
    }
  });
  styleDataRows(summarySheet, 1, 8);


  // ==========================================
  // SHEET 2: TEST CASES
  // ==========================================
  const tcSheet = workbook.addWorksheet('Test Cases', { views: [{ showGridLines: true }] });
  tcSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 18 },
    { header: 'Scenario Name', key: 'scenario', width: 45 },
    { header: 'Browser', key: 'browser', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Start Time', key: 'start', width: 22 },
    { header: 'End Time', key: 'end', width: 22 },
    { header: 'Duration', key: 'duration', width: 12 }
  ];
  styleHeader(tcSheet.getRow(1), colors.primary);

  results.tests.forEach((t, idx) => {
    const row = tcSheet.addRow({
      id: `LP-TC-${String(idx + 1).padStart(3, '0')}`,
      module: t.module || 'E2E Core',
      scenario: t.title,
      browser: config.browserName,
      status: t.status.toUpperCase(),
      start: t.start,
      end: t.end,
      duration: t.duration
    });

    const statusCell = row.getCell('status');
    statusCell.font = { bold: true, color: { argb: t.status === 'passed' ? 'FF10B981' : 'FFEF4444' } };
    statusCell.alignment = { horizontal: 'center' };
  });
  styleDataRows(tcSheet, 1, 8);


  // ==========================================
  // SHEET 3: FAILED TESTS
  // ==========================================
  const failSheet = workbook.addWorksheet('Failed Tests', { views: [{ showGridLines: true }] });
  failSheet.columns = [
    { header: 'Test Name', key: 'name', width: 40 },
    { header: 'Failure Reason', key: 'reason', width: 60 },
    { header: 'Screenshot Path', key: 'screenshot', width: 50 },
    { header: 'Browser', key: 'browser', width: 12 },
    { header: 'URL', key: 'url', width: 40 }
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
  // SHEET 4: EXECUTION LOGS
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
