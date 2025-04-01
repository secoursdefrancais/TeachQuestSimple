// src/utils/exportUtils.ts

import { Evaluation, Student } from '../types';
import { evaluationService } from '../services/evaluation.service';
/**
 * Converts evaluation data to CSV format
 * @param evaluation The evaluation data to convert
 * @param students List of students to include in the export
 * @returns CSV formatted string
 */
export const evaluationToCSV = (evaluation: Evaluation, students: Student[]): string => {
  // Create header row
  const headers = ['Nom', 'Prénom', 'Note', 'Note /20', 'Commentaires'];
  let csv = headers.join(',') + '\n';
  
  // Process each student copy
  evaluation.copies
    .filter(copy => copy.grade !== null)
    .forEach(copy => {
      const student = students.find(s => s.id === copy.studentId);
      if (!student) return;
      
      // Format student data
      const lastName = student.lastName.replace(/,/g, ' '); // Replace commas to avoid CSV issues
      const firstName = student.firstName.replace(/,/g, ' ');
      const grade = copy.grade || 0;
      const gradeOn20 = ((grade / evaluation.maxPoints) * 20).toFixed(1);
      
      // Format comments - escape quotes and replace newlines
      const comments = copy.comments 
        ? `"${copy.comments.replace(/"/g, '""').replace(/\n/g, ' ')}"`
        : '';
      
      // Add row to CSV
      csv += `${lastName},${firstName},${grade},${gradeOn20},${comments}\n`;
    });
  
  return csv;
};

/**
 * Initiates download of CSV file
 * @param csvContent CSV content to download
 * @param fileName Name of the file to download
 */
export const downloadCSV = (csvContent: string, fileName: string): void => {
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Support for browsers that support the download attribute
  if ((navigator as any).msSaveBlob) {
    (navigator as any).msSaveBlob(blob, fileName);
  } else {
    // Other browsers
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Generates a detailed CSV export including all rubric criteria
 * @param evaluation The evaluation data to convert
 * @param students List of students to include in the export
 * @returns CSV formatted string
 */
export const evaluationToDetailedCSV = (evaluation: Evaluation, students: Student[]): string => {
  // Get the rubric details
  const rubric = evaluationService.getRubricById(evaluation.rubricId);
  if (!rubric) {
    return evaluationToCSV(evaluation, students); // Fallback to simple CSV
  }
  
  // Create headers with all criteria
  let headers = ['Nom', 'Prénom'];
  
  // Add a column for each criterion and subcriterion
  rubric.criteria.forEach(criterion => {
    if (criterion.subCriteria && criterion.subCriteria.length > 0) {
      criterion.subCriteria.forEach(sub => {
        headers.push(`${criterion.name} - ${sub.name}`);
      });
    } else {
      headers.push(criterion.name);
    }
  });
  
  // Add total and comments columns
  headers.push('Total', 'Note /20', 'Commentaires');
  
  let csv = headers.join(',') + '\n';
  
  // Process each student
  evaluation.copies
    .filter(copy => copy.grade !== null)
    .forEach(copy => {
      const student = students.find(s => s.id === copy.studentId);
      if (!student) return;
      
      // Start with student name
      const row = [
        student.lastName.replace(/,/g, ' '),
        student.firstName.replace(/,/g, ' ')
      ];
      
      // Add criteria data
      rubric.criteria.forEach((criterion, cIndex) => {
        const criterionDetail = copy.details && copy.details[cIndex];
        
        if (criterion.subCriteria && criterion.subCriteria.length > 0) {
          // Handle subcriteria
          criterion.subCriteria.forEach((sub, sIndex) => {
            const subDetail = criterionDetail && 
                              criterionDetail.subCriteria && 
                              criterionDetail.subCriteria[sIndex];
            row.push(subDetail ? subDetail.points.toString() : '0');
          });
        } else {
          // Handle single criterion
          row.push(criterionDetail ? criterionDetail.points.toString() : '0');
        }
      });
      
      // Add total grade
      row.push((copy.grade || 0).toString());
      
      // Add grade on 20
      row.push(((copy.grade || 0) / evaluation.maxPoints * 20).toFixed(1));
      
      // Add comments
      row.push(copy.comments ? 
        `"${copy.comments.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '');
      
      // Add row to CSV
      csv += row.join(',') + '\n';
    });
  
  return csv;
};
