// src/components/students/StudentImportDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpIcon from '@mui/icons-material/Help';
import WarningIcon from '@mui/icons-material/Warning';
import { importStudentsFromCSV } from '../../utils/csvUtils';
import { Student } from '../../types';
import { studentService } from '../../services/student.service';

interface StudentImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const StudentImportDialog: React.FC<StudentImportDialogProps> = ({ 
  open, 
  onClose, 
  onImportComplete 
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [group, setGroup] = useState('');
  
  // Gérer le téléchargement du fichier
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      parseCSV(content);
    };
    
    reader.readAsText(file);
  };
  
  // Parser le contenu CSV
  const parseCSV = (content: string) => {
    setLoading(true);
    setParseErrors([]);
    
    try {
      const result = importStudentsFromCSV(content);
      setParseErrors(result.errors);
      setStudents(result.students);
      setGroup(result.group);
    } catch (error) {
      console.error("Erreur lors du parsing du CSV:", error);
      setParseErrors(["Erreur lors de l'analyse du fichier. Vérifiez le format CSV."]);
    } finally {
      setLoading(false);
    }
  };
  
  // Effacer le fichier
  const handleClearFile = () => {
    setCsvContent('');
    setFileName('');
    setParseErrors([]);
    setStudents([]);
    setGroup('');
  };
  
  // Importer les élèves
  const handleImport = () => {
    setLoading(true);
    
    try {
      // Créer la structure de groupe
      const studentGroup = {
        group,
        students
      };
      
      // Sauvegarder le groupe d'élèves
      // Note: Dans une implémentation réelle, vous devriez vérifier 
      // si le groupe existe déjà et fusionner les données
      
      // Pour chaque élève, nous appelons saveStudent
      students.forEach(student => {
        studentService.saveStudent(student, group);
      });
      
      setImportSuccess(true);
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      setParseErrors([...parseErrors, "Erreur lors de l'importation des élèves."]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Importer des élèves depuis un fichier CSV
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {importSuccess ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Importation réussie ! {students.length} élèves ont été importés dans le groupe "{group}".
          </Alert>
        ) : (
          <>
            {parseErrors.length > 0 && (
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Des problèmes ont été détectés lors de l'analyse du fichier:
                </Typography>
                <List dense disablePadding>
                  {parseErrors.map((error, index) => (
                    <ListItem key={index} dense disablePadding>
                      <ListItemText 
                        primary={error} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    1. Télécharger un fichier CSV
                  </Typography>
                  
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    p: 3, 
                    textAlign: 'center',
                    mb: 2,
                    borderRadius: 1
                  }}>
                    <input
                      accept=".csv"
                      style={{ display: 'none' }}
                      id="csv-file-upload"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="csv-file-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                      >
                        Parcourir
                      </Button>
                    </label>
                    
                    {fileName && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Chip
                          label={fileName}
                          onDelete={handleClearFile}
                          deleteIcon={<DeleteIcon />}
                        />
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Format requis:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Le fichier CSV doit contenir les colonnes suivantes:
                  </Typography>
                  <List dense>
                    <ListItem dense disablePadding>
                      <ListItemText primary="• Prénom" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem dense disablePadding>
                      <ListItemText primary="• Nom" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem dense disablePadding>
                      <ListItemText primary="• Email" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem dense disablePadding>
                      <ListItemText primary="• Date de naissance (YYYY-MM-DD)" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    <ListItem dense disablePadding>
                      <ListItemText primary="• Groupe" primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    2. Aperçu des données
                  </Typography>
                  
                  {students.length > 0 ? (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">
                          Groupe: {group}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {students.length} élève{students.length > 1 ? 's' : ''} détecté{students.length > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Nom</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Prénom</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student, index) => (
                              <tr key={index}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{student.lastName}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{student.firstName}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{student.email}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '300px',
                      bgcolor: '#f5f5f5',
                      borderRadius: 1
                    }}>
                      <HelpIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Téléchargez un fichier CSV pour voir l'aperçu des données
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    3. Importer les données
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Une fois que vous avez vérifié l'aperçu des données et résolu les éventuelles erreurs,
                    cliquez sur le bouton "Importer" pour ajouter ces élèves au système.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          {importSuccess ? 'Fermer' : 'Annuler'}
        </Button>
        
        {!importSuccess && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleImport}
            disabled={students.length === 0 || loading || parseErrors.length > 0}
          >
            Importer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StudentImportDialog;