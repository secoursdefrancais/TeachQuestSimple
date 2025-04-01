// src/components/students/StudentsView.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert, 
  ListItemButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Student, StudentGroup, Evaluation } from '../../types';
import { studentService } from '../../services/student.service';
import { evaluationService } from '../../services/evaluation.service';
import StudentImportDialog from './StudentImportDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`students-tabpanel-${index}`}
      aria-labelledby={`students-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StudentsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    group: ''
  });
  
  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les groupes d'étudiants
      const groups = studentService.getAllStudentGroups();
      setStudentGroups(groups);
      
      // Charger les évaluations
      const evals = evaluationService.getAllEvaluations();
      setEvaluations(evals);
      
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Impossible de charger les données des élèves. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // Gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedStudent(null); // Réinitialiser l'élève sélectionné
  };
  
  // Ouvrir le dialogue d'importation
  const handleOpenImportDialog = () => {
    setIsImportDialogOpen(true);
  };
  
  // Fermer le dialogue d'importation
  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
  };
  
  // Gérer l'importation complète
  const handleImportComplete = () => {
    // Recharger les données après l'importation
    loadData();
    setSuccess("Importation réussie !");
    setTimeout(() => setSuccess(null), 3000);
  };
  
  // Ouvrir le menu d'options pour un élève
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, student: Student) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedStudent(student); // Définir l'élève sélectionné pour les actions du menu
  };
  
  // Fermer le menu d'options
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };
  
  // Ouvrir le dialogue d'édition
  const handleEditStudent = () => {
    if (!selectedStudent) return;
    
    setStudentToEdit(selectedStudent);
    // Initialiser le formulaire avec les données de l'élève
    setEditFormData({
      firstName: selectedStudent.firstName,
      lastName: selectedStudent.lastName,
      email: selectedStudent.email,
      birthDate: selectedStudent.birthDate,
      group: selectedStudent.id.split('-')[0] // Supposons que l'ID commence par le groupe
    });
    
    setIsEditDialogOpen(true);
    handleCloseMenu();
  };
  
  // Ouvrir le dialogue de suppression
  const handleDeleteStudent = () => {
    if (!selectedStudent) return;
    
    setStudentToDelete(selectedStudent);
    setIsDeleteDialogOpen(true);
    handleCloseMenu();
  };
  
  // Soumettre le formulaire d'édition
  const handleSubmitEdit = () => {
    if (!studentToEdit) return;
    
    try {
      // Créer l'objet étudiant mis à jour
      const updatedStudent: Student = {
        ...studentToEdit,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        birthDate: editFormData.birthDate
      };
      
      // Enregistrer l'étudiant
      studentService.saveStudent(updatedStudent, editFormData.group);
      
      // Mettre à jour l'affichage
      loadData();
      
      setSuccess("Élève mis à jour avec succès");
      setTimeout(() => setSuccess(null), 3000);
      
      setIsEditDialogOpen(false);
      setStudentToEdit(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'élève:", error);
      setError("Erreur lors de la mise à jour de l'élève");
    }
  };
  
  // Confirmer la suppression d'un élève
  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    
    try {
      // Logique de suppression - ceci est une approximation car l'API exacte n'est pas donnée
      const groupName = studentToDelete.id.split('-')[0];
      const groupIndex = studentGroups.findIndex(g => g.group === groupName);
      
      if (groupIndex !== -1) {
        const updatedGroup = {
          ...studentGroups[groupIndex],
          students: studentGroups[groupIndex].students.filter(s => s.id !== studentToDelete.id)
        };
        
        const updatedGroups = [...studentGroups];
        updatedGroups[groupIndex] = updatedGroup;
        
        // Nous devrions avoir une méthode appropriée dans le service
        // Pour simplifier, nous appelons simplement loadData() pour rafraîchir
        loadData();
        
        setSuccess("Élève supprimé avec succès");
        setTimeout(() => setSuccess(null), 3000);
      }
      
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'élève:", error);
      setError("Erreur lors de la suppression de l'élève");
    }
  };
  
  // Sélectionner un élève pour afficher ses détails
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
  };
  
  // Ajouter un nouvel élève
  const handleAddStudent = () => {
    // Réinitialiser le formulaire
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      birthDate: format(new Date(), 'yyyy-MM-dd'),
      group: studentGroups.length > 0 ? studentGroups[0].group : ''
    });
    
    setStudentToEdit(null); // Indiquer que c'est un nouvel élève
    setIsEditDialogOpen(true);
  };
  
  // Filtrer les élèves selon la recherche
  const getFilteredStudents = (students: Student[]) => {
    if (!searchQuery.trim()) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter(student => 
      student.firstName.toLowerCase().includes(query) || 
      student.lastName.toLowerCase().includes(query)
    );
  };
  
  // Obtenir les évaluations d'un élève
  const getStudentEvaluations = (studentId: string) => {
    return evaluations.filter(ev => 
      ev.copies.some(copy => copy.studentId === studentId)
    );
  };
  
  // Calculer la moyenne d'un élève
  const calculateStudentAverage = (studentId: string): number => {
    const studentEvals = getStudentEvaluations(studentId);
    if (studentEvals.length === 0) return 0;
    
    let totalWeightedPoints = 0;
    let totalMaxWeightedPoints = 0;
    
    studentEvals.forEach(ev => {
      const copy = ev.copies.find(c => c.studentId === studentId);
      if (copy && copy.grade !== null) {
        totalWeightedPoints += copy.grade * ev.coefficient;
        totalMaxWeightedPoints += ev.maxPoints * ev.coefficient;
      }
    });
    
    if (totalMaxWeightedPoints === 0) return 0;
    return (totalWeightedPoints / totalMaxWeightedPoints) * 20;
  };
  
  // Déterminer la couleur pour une note
  const getGradeColor = (grade: number, maxPoints: number): string => {
    const percentage = (grade / maxPoints) * 100;
    
    if (percentage >= 85) return 'success.main';
    if (percentage >= 70) return 'success.light';
    if (percentage >= 50) return 'warning.main';
    return 'error.main';
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Gestion des élèves
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenImportDialog}
            sx={{ mr: 1 }}
          >
            Importer des élèves
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddStudent}
          >
            Ajouter un élève
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="onglets groupes d'étudiants"
            variant="scrollable"
            scrollButtons="auto"
          >
            {studentGroups.map((group, index) => (
              <Tab 
                key={group.group} 
                label={`${group.group} (${group.students.length})`}
                id={`students-tab-${index}`}
                aria-controls={`students-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>
        
        {studentGroups.map((group, index) => (
          <TabPanel key={group.group} value={tabValue} index={index}>
            <Grid container spacing={3}>
              {/* Liste des élèves */}
              <Grid item xs={12} md={selectedStudent ? 4 : 12}>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Rechercher un élève..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery('')}>
                            <FilterListIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    size="small"
                  />
                </Box>
                
                <Paper variant="outlined">
                  <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                    {getFilteredStudents(group.students).length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Aucun élève ne correspond à la recherche
                        </Typography>
                      </Box>
                    ) : (
                      getFilteredStudents(group.students).map((student) => {
                        const studentAverage = calculateStudentAverage(student.id);
                        return (
                          <React.Fragment key={student.id}>
                            <ListItemButton 
                              selected={selectedStudent?.id === student.id}
                              onClick={() => handleSelectStudent(student)}
                            >
                              <ListItemAvatar>
                                <Avatar>
                                  {student.firstName[0]}{student.lastName[0]}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${student.lastName} ${student.firstName}`}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon fontSize="small" />
                                    <Typography variant="caption">
                                      {group.group}
                                    </Typography>
                                    {studentAverage > 0 && (
                                      <Chip
                                        label={`${studentAverage.toFixed(1)}/20`}
                                        size="small"
                                        color={studentAverage >= 10 ? "success" : "error"}
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenMenu(e, student)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </ListItemButton>
                            <Divider variant="inset" component="li" />
                          </React.Fragment>
                        );
                      })
                    )}
                  </List>
                </Paper>
              </Grid>
              
              {/* Détails de l'élève sélectionné */}
              {selectedStudent && (
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                        </Avatar>
                      }
                      title={`${selectedStudent.lastName} ${selectedStudent.firstName}`}
                      subheader={group.group}
                      action={
                        <Box>
                          <Tooltip title="Modifier">
                            <IconButton onClick={handleEditStudent}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={handleDeleteStudent}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Informations personnelles
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                Né(e) le {format(parseISO(selectedStudent.birthDate), 'dd MMMM yyyy', { locale: fr })}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {selectedStudent.email}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography variant="subtitle2" gutterBottom>
                            Statistiques
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Moyenne générale:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={calculateStudentAverage(selectedStudent.id) >= 10 ? "success.main" : "error.main"}
                            >
                              {calculateStudentAverage(selectedStudent.id).toFixed(1)}/20
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Évaluations:
                            </Typography>
                            <Typography variant="body2">
                              {getStudentEvaluations(selectedStudent.id).length}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Notes
                          </Typography>
                          
                          {getStudentEvaluations(selectedStudent.id).length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Aucune évaluation pour cet élève
                            </Typography>
                          ) : (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Évaluation</TableCell>
                                    <TableCell align="right">Note</TableCell>
                                    <TableCell align="right">Coef.</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {getStudentEvaluations(selectedStudent.id)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(evaluation => {
                                      const copy = evaluation.copies.find(c => c.studentId === selectedStudent.id);
                                      return (
                                        <TableRow key={evaluation.id}>
                                          <TableCell>
                                            <Typography variant="body2" noWrap>
                                              {evaluation.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {format(parseISO(evaluation.date), 'dd/MM/yyyy')}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            {copy?.grade !== null ? (
                                              <Chip
                                                label={`${copy?.grade}/${evaluation.maxPoints}`}
                                                size="small"
                                                sx={{ 
                                                  bgcolor: getGradeColor(copy?.grade || 0, evaluation.maxPoints),
                                                  color: 'white'
                                                }}
                                              />
                                            ) : (
                                              <Chip
                                                label="Non corrigé"
                                                size="small"
                                                variant="outlined"
                                              />
                                            )}
                                          </TableCell>
                                          <TableCell align="right">
                                            {evaluation.coefficient}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Commentaires récents
                          </Typography>
                          
                          {getStudentEvaluations(selectedStudent.id)
                            .filter(ev => {
                              const copy = ev.copies.find(c => c.studentId === selectedStudent.id);
                              return copy?.comments && copy.comments.trim() !== '';
                            }).length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Aucun commentaire disponible
                            </Typography>
                          ) : (
                            <List>
                              {getStudentEvaluations(selectedStudent.id)
                                .filter(ev => {
                                  const copy = ev.copies.find(c => c.studentId === selectedStudent.id);
                                  return copy?.comments && copy.comments.trim() !== '';
                                })
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 3) // Limiter aux 3 plus récents
                                .map(evaluation => {
                                  const copy = evaluation.copies.find(c => c.studentId === selectedStudent.id);
                                  return (
                                    <ListItem key={evaluation.id} sx={{ px: 0 }}>
                                      <ListItemAvatar>
                                        <Avatar>
                                          <AssignmentIcon />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={evaluation.name}
                                        secondary={copy?.comments}
                                      />
                                    </ListItem>
                                  );
                                })}
                            </List>
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        ))}
      </Paper>
      
      {/* Menu d'options pour les élèves */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEditStudent}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteStudent}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Supprimer" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>
      
      {/* Dialogue d'importation d'élèves */}
      <StudentImportDialog
        open={isImportDialogOpen}
        onClose={handleCloseImportDialog}
        onImportComplete={handleImportComplete}
      />
      
      {/* Dialogue d'édition d'élève */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {studentToEdit ? 'Modifier un élève' : 'Ajouter un élève'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom"
                fullWidth
                required
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prénom"
                fullWidth
                required
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                required
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de naissance"
                fullWidth
                required
                type="date"
                value={editFormData.birthDate}
                onChange={(e) => setEditFormData({...editFormData, birthDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Groupe</InputLabel>
                <Select
                  value={editFormData.group}
                  label="Groupe"
                  onChange={(e) => setEditFormData({...editFormData, group: e.target.value as string})}
                >
                  {studentGroups.map(group => (
                    <MenuItem key={group.group} value={group.group}>
                      {group.group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmitEdit}
            disabled={!editFormData.firstName || !editFormData.lastName || !editFormData.email || !editFormData.birthDate || !editFormData.group}
          >
            {studentToEdit ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'élève <strong>{studentToDelete?.lastName} {studentToDelete?.firstName}</strong> ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible. Toutes les données associées à cet élève seront également supprimées.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsView;