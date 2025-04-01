// src/utils/csvUtils.ts

/**
 * Converts CSV data to JSON
 * @param csvString CSV formatted string to convert
 * @param options Additional options for conversion
 * @returns Array of objects representing the CSV data
 */
export const csvToJson = (
    csvString: string, 
    options: { 
      delimiter?: string; 
      hasHeader?: boolean;
      headerMap?: Record<string, string>;
    } = {}
  ): any[] => {
    // Default options
    const delimiter = options.delimiter || ',';
    const hasHeader = options.hasHeader !== undefined ? options.hasHeader : true;
    
    // Split the CSV into rows
    const rows = csvString
      .split(/\r?\n/)
      .filter(row => row.trim() !== '');
    
    if (rows.length === 0) {
      return [];
    }
    
    // Parse the header row if present
    const headers = hasHeader 
      ? rows[0].split(delimiter).map(header => header.trim())
      : [];
    
    // If headerMap is provided, transform headers
    const mappedHeaders = options.headerMap && hasHeader
      ? headers.map(header => options.headerMap?.[header] || header)
      : headers;
    
    // Start from the second row if we have a header, otherwise from the first
    const startRowIndex = hasHeader ? 1 : 0;
    
    // Process each data row
    return rows.slice(startRowIndex).map(row => {
      // Split the row by delimiter, handling quoted fields
      const values = parseCSVRow(row, delimiter);
      
      if (!hasHeader) {
        // If no header, return array of values
        return values;
      }
      
      // Create an object with header-value pairs
      const obj: Record<string, string> = {};
      mappedHeaders.forEach((header, index) => {
        if (index < values.length) {
          obj[header] = values[index];
        }
      });
      
      return obj;
    });
  };
  
  /**
   * Parse a CSV row, properly handling quoted fields
   * @param row The CSV row to parse
   * @param delimiter The CSV delimiter
   * @returns Array of field values
   */
  const parseCSVRow = (row: string, delimiter: string): string[] => {
    const result: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = i < row.length - 1 ? row[i + 1] : '';
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Handle escaped quotes (two double quotes in sequence)
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle the insideQuotes flag
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        // End of field
        result.push(currentValue);
        currentValue = '';
      } else {
        // Normal character
        currentValue += char;
      }
    }
    
    // Add the last field
    result.push(currentValue);
    
    return result;
  };
  
  /**
   * Utility to help with importing student data from CSV
   * @param csvData CSV data string
   * @returns Structured student data ready for import
   */
  export const importStudentsFromCSV = (csvData: string): {
    students: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      birthDate: string;
    }[];
    group: string;
    errors: string[];
  } => {
    const errors: string[] = [];
    let group = '';
    
    try {
      // Convert CSV to JSON
      const data = csvToJson(csvData);
      
      // Check if we have the required columns
      const requiredColumns = ['Prénom', 'Nom', 'Email', 'Date de naissance', 'Groupe'];
      const missingColumns = requiredColumns.filter(col => 
        !Object.keys(data[0] || {}).includes(col)
      );
      
      if (missingColumns.length > 0) {
        errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
        return { students: [], group: '', errors };
      }
      
      // Extract group name from the first row
      group = data[0]?.Groupe || '';
      
      // Map data to student objects
      const students = data.map((row, index) => {
        // Validate the row
        if (!row.Prénom) errors.push(`Ligne ${index + 2}: Prénom manquant`);
        if (!row.Nom) errors.push(`Ligne ${index + 2}: Nom manquant`);
        if (!row.Email) errors.push(`Ligne ${index + 2}: Email manquant`);
        if (!row['Date de naissance']) errors.push(`Ligne ${index + 2}: Date de naissance manquante`);
        
        // Generate a unique ID based on group and row index
        const studentId = `${group}-${(index + 1).toString().padStart(2, '0')}`;
        
        return {
          id: studentId,
          firstName: row.Prénom || '',
          lastName: row.Nom || '',
          email: row.Email || '',
          birthDate: row['Date de naissance'] || new Date().toISOString().split('T')[0]
        };
      });
      
      return { students, group, errors };
    } catch (error) {
      console.error("Error parsing CSV:", error);
      errors.push("Erreur lors de l'analyse du fichier CSV. Vérifiez le format du fichier.");
      return { students: [], group: '', errors };
    }
  };