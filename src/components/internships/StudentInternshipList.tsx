// src/components/internships/StudentInternshipList.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Divider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';


import { StudentInternship } from '../../types';
import { Student } from '../../types';
import { studentService } from '../../services/student.service';
import { storageService } from '../../services/storage.service';

const StudentInternshipList: React.FC = () => {
  const [internships, setInternships] = useState<StudentInternship[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentInternship, setCurrentInternship] = useState<StudentInternship>({
    studentId: '',
    companyName: '',
    location: '',
    supervisorName: '',
    supervisorContact: '',
    supervisorPhone: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    visitRequired: true,
    visitScheduled: false,
    visitDate: null,
    visitCompleted: false,
    notes: ''
  });

  useEffect(() => {
    // Charger les internships
    const storedInternships = storageService.getCollection<StudentInternship>('studentInternships');
    setInternships(storedInternships);

    // Charger la liste des étudiants
    const allStudents = studentService.getAllStudents();
    setStudents(allStudents);
  }, []);

  const handleOpenDialog = (internship?: StudentInternship) => {
    if (internship) {
      setCurrentInternship(internship);
      setEditMode(true);
    } else {
      setCurrentInternship({
        studentId: '',
        companyName: '',
        location: '',
        supervisorName: '',
        supervisorContact: '',
        supervisorPhone: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        visitRequired: true,
        visitScheduled: false,
        visitDate: null,
        visitCompleted: false,
        notes: ''
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentInternship(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentInternship(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSave = () => {
    if (editMode) {
      // Mise à jour d'un stage existant
      const updatedInternships = internships.map(i => 
        i.studentId === currentInternship.studentId ? currentInternship : i
      );
      setInternships(updatedInternships);
      storageService.setCollection('studentInternships', updatedInternships);
    } else {
      // Création d'un nouveau stage
      const newInternships = [...internships, currentInternship];
      setInternships(newInternships);
      storageService.setCollection('studentInternships', newInternships);
    }
    
    handleCloseDialog();
  };

  const handleDelete = (studentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce stage ?')) {
      const updatedInternships = internships.filter(i => i.studentId !== studentId);
      setInternships(updatedInternships);
      storageService.setCollection('studentInternships', updatedInternships);
    }
  };

  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Étudiant inconnu';
  };

  const getStudentGroup = (studentId: string): string => {
    const studentGroups = studentService.getAllStudentGroups();
    for (const group of studentGroups) {
      if (group.students.some(s => s.id === studentId)) {
        return group.group;
      }
    }
    return '';
  };

  return (
    <Card>
      <CardHeader 
        title="Stages des élèves" 
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Ajouter un stage
          </Button>
        }
      />
      <CardContent>
        {internships.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucun stage enregistré.
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {internships.map((internship) => {
              const studentName = getStudentName(internship.studentId);
              const studentGroup = getStudentGroup(internship.studentId);
              
              return (
                <Card key={internship.studentId} sx={{ mb: 2, bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {studentName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {studentGroup}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Chip 
                          icon={internship.visitScheduled ? <CheckCircleIcon /> : <CancelIcon />} 
                          label={internship.visitScheduled ? "Visite planifiée" : "Visite non planifiée"}
                          color={internship.visitScheduled ? "success" : "default"}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {internship.visitCompleted && (
                          <Chip 
                            label="Visite effectuée" 
                            color="primary"
                            size="small"
                          />
                        )}
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          {internship.companyName}
                        </Typography>
                        <Typography variant="body2">
                          {internship.location}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          Du {format(parseISO(internship.startDate), 'dd/MM/yyyy')} 
                          au {format(parseISO(internship.endDate), 'dd/MM/yyyy')}
                        </Typography>
                        {internship.visitDate && (
                          <Typography variant="body2" color="primary">
                            Visite prévue le {format(parseISO(internship.visitDate), 'dd/MM/yyyy')}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Tuteur:</strong> {internship.supervisorName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Contact:</strong> {internship.supervisorContact}
                        </Typography>
                        {internship.supervisorPhone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> 
                            {internship.supervisorPhone}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(internship)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(internship.studentId)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      
                      {internship.notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            <strong>Notes:</strong> {internship.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </CardContent>

      {/* Dialogue d'ajout/édition */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifier un stage' : 'Ajouter un stage'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="student-label">Étudiant</InputLabel>
                <Select
                  labelId="student-label"
                  name="studentId"
                  value={currentInternship.studentId}
                  onChange={handleChange}
                  label="Étudiant"
                >
                  {students.map(student => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} - {getStudentGroup(student.id)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="companyName"
                label="Entreprise"
                value={currentInternship.companyName}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="location"
                label="Lieu"
                value={currentInternship.location}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="startDate"
                label="Date de début"
                type="date"
                value={currentInternship.startDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="endDate"
                label="Date de fin"
                type="date"
                value={currentInternship.endDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="supervisorName"
                label="Nom du tuteur"
                value={currentInternship.supervisorName}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="supervisorContact"
                label="Contact du tuteur (email)"
                value={currentInternship.supervisorContact}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="supervisorPhone"
                label="Téléphone du tuteur"
                value={currentInternship.supervisorPhone || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentInternship.visitRequired}
                    onChange={handleBooleanChange}
                    name="visitRequired"
                  />
                }
                label="Visite requise"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentInternship.visitScheduled}
                    onChange={handleBooleanChange}
                    name="visitScheduled"
                    disabled={!currentInternship.visitRequired}
                  />
                }
                label="Visite planifiée"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="visitDate"
                label="Date de visite"
                type="date"
                value={currentInternship.visitDate || ''}
                onChange={handleChange}
                disabled={!currentInternship.visitScheduled}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentInternship.visitCompleted}
                    onChange={handleBooleanChange}
                    name="visitCompleted"
                    disabled={!currentInternship.visitScheduled}
                  />
                }
                label="Visite effectuée"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="notes"
                label="Notes"
                value={currentInternship.notes || ''}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary" 
            disabled={!currentInternship.studentId || !currentInternship.companyName}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default StudentInternshipList;