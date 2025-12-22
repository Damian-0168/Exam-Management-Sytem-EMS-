import { StudentReport, ClassReport } from '@/types';

// Simple PDF export using browser print
export const exportStudentReportPDF = async (report: StudentReport) => {
  // Create a printable HTML structure
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Report - ${report.student.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-title {
          font-size: 18px;
          color: #666;
        }
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .info-item {
          display: flex;
          gap: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #333;
          color: white;
          font-weight: bold;
        }
        .text-center {
          text-align: center;
        }
        .summary {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        .summary-card {
          border: 2px solid #333;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }
        .grade-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #333;
          color: white;
          border-radius: 4px;
          font-weight: bold;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .remarks-section {
          margin-top: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .remarks-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .remark-item {
          margin: 8px 0;
        }
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class=\"header\">
        <div class=\"school-name\">School Report Card</div>
        <div class=\"report-title\">${report.exam.name} - ${report.exam.academicYear}</div>
      </div>

      <div class=\"student-info\">
        <div class=\"info-item\">
          <span class=\"info-label\">Student Name:</span>
          <span>${report.student.name}</span>
        </div>
        <div class=\"info-item\">
          <span class=\"info-label\">Roll Number:</span>
          <span>${report.student.rollNumber}</span>
        </div>
        <div class=\"info-item\">
          <span class=\"info-label\">Class:</span>
          <span>${report.student.class} ${report.student.section}</span>
        </div>
        <div class=\"info-item\">
          <span class=\"info-label\">Guardian:</span>
          <span>${report.student.guardian}</span>
        </div>
        <div class=\"info-item\">
          <span class=\"info-label\">Exam Date:</span>
          <span>${new Date(report.exam.startDate).toLocaleDateString()}</span>
        </div>
        <div class=\"info-item\">
          <span class=\"info-label\">Term:</span>
          <span style=\"text-transform: capitalize;\">${report.exam.term}</span>
        </div>
      </div>

      <h2>Subject-wise Performance</h2>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th class=\"text-center\">Marks Obtained</th>
            <th class=\"text-center\">Max Marks</th>
            <th class=\"text-center\">Percentage</th>
            <th class=\"text-center\">Grade</th>
            <th class=\"text-center\">GPA</th>
          </tr>
        </thead>
        <tbody>
          ${report.scores.map(score => {
            const percentage = ((score.marksObtained / score.maxMarks) * 100).toFixed(1);
            return `
              <tr>
                <td>${score.subject.name}</td>
                <td class=\"text-center\">${score.marksObtained}</td>
                <td class=\"text-center\">${score.maxMarks}</td>
                <td class=\"text-center\">${percentage}%</td>
                <td class=\"text-center\"><span class=\"grade-badge\">${score.grade}</span></td>
                <td class=\"text-center\">${score.gpa.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          <tr style=\"background: #f5f5f5; font-weight: bold;\">
            <td>Total / Average</td>
            <td class=\"text-center\">${report.obtainedMarks}</td>
            <td class=\"text-center\">${report.totalMarks}</td>
            <td class=\"text-center\">${report.percentage.toFixed(2)}%</td>
            <td class=\"text-center\"><span class=\"grade-badge\">${report.overallGrade}</span></td>
            <td class=\"text-center\">${report.overallGPA.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class=\"summary\">
        <div class=\"summary-card\">
          <div class=\"summary-label\">Overall Percentage</div>
          <div class=\"summary-value\">${report.percentage.toFixed(2)}%</div>
        </div>
        <div class=\"summary-card\">
          <div class=\"summary-label\">Overall Grade</div>
          <div class=\"summary-value\">${report.overallGrade}</div>
        </div>
        <div class=\"summary-card\">
          <div class=\"summary-label\">Class Rank</div>
          <div class=\"summary-value\">#${report.position}</div>
        </div>
      </div>

      ${report.scores.some(s => s.remarks) ? `
        <div class=\"remarks-section\">
          <div class=\"remarks-title\">Teacher Remarks</div>
          ${report.scores
            .filter(s => s.remarks)
            .map(score => `
              <div class=\"remark-item\">
                <strong>${score.subject.name}:</strong> ${score.remarks}
              </div>
            `).join('')}
        </div>
      ` : ''}

      <div class=\"footer\">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};

export const exportClassReportPDF = async (report: ClassReport) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Class Report - ${report.class} ${report.section}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-title {
          font-size: 18px;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          border: 2px solid #333;
          padding: 15px;
          text-align: center;
          border-radius: 8px;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #333;
          color: white;
          font-weight: bold;
        }
        .text-center {
          text-align: center;
        }
        h2 {
          margin-top: 40px;
          color: #333;
          border-bottom: 2px solid #ddd;
          padding-bottom: 10px;
        }
        .grade-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #333;
          color: white;
          border-radius: 4px;
          font-weight: bold;
          font-size: 10px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class=\"header\">
        <div class=\"school-name\">Class Performance Report</div>
        <div class=\"report-title\">
          Class ${report.class} ${report.section} - ${report.exam.name} (${report.exam.academicYear})
        </div>
      </div>

      <div class=\"stats-grid\">
        <div class=\"stat-card\">
          <div class=\"stat-label\">Total Students</div>
          <div class=\"stat-value\">${report.students.length}</div>
        </div>
        <div class=\"stat-card\">
          <div class=\"stat-label\">Class Average</div>
          <div class=\"stat-value\">${report.classAverage.toFixed(2)}%</div>
        </div>
        <div class=\"stat-card\">
          <div class=\"stat-label\">Highest Score</div>
          <div class=\"stat-value\">${report.highestScore.toFixed(2)}%</div>
        </div>
        <div class=\"stat-card\">
          <div class=\"stat-label\">Pass Rate</div>
          <div class=\"stat-value\">${report.passRate.toFixed(1)}%</div>
        </div>
      </div>

      <h2>Subject Analytics</h2>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th class=\"text-center\">Average</th>
            <th class=\"text-center\">Highest</th>
            <th class=\"text-center\">Lowest</th>
            <th class=\"text-center\">Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          ${report.subjectAnalytics.map(analytic => `
            <tr>
              <td>${analytic.subject.name}</td>
              <td class=\"text-center\">${analytic.averageMarks.toFixed(2)}</td>
              <td class=\"text-center\">${analytic.highestMarks}</td>
              <td class=\"text-center\">${analytic.lowestMarks}</td>
              <td class=\"text-center\">${analytic.passRate.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class=\"page-break\"></div>

      <h2>Student Rankings</h2>
      <table>
        <thead>
          <tr>
            <th class=\"text-center\">Rank</th>
            <th>Roll No.</th>
            <th>Student Name</th>
            <th class=\"text-center\">Total</th>
            <th class=\"text-center\">Obtained</th>
            <th class=\"text-center\">%</th>
            <th class=\"text-center\">Grade</th>
            <th class=\"text-center\">GPA</th>
          </tr>
        </thead>
        <tbody>
          ${report.students.map(studentReport => `
            <tr>
              <td class=\"text-center\"><strong>#${studentReport.position}</strong></td>
              <td>${studentReport.student.rollNumber}</td>
              <td>${studentReport.student.name}</td>
              <td class=\"text-center\">${studentReport.totalMarks}</td>
              <td class=\"text-center\">${studentReport.obtainedMarks}</td>
              <td class=\"text-center\">${studentReport.percentage.toFixed(2)}%</td>
              <td class=\"text-center\"><span class=\"grade-badge\">${studentReport.overallGrade}</span></td>
              <td class=\"text-center\">${studentReport.overallGPA.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class=\"footer\">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};