import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { Evaluation, Rubric, Student } from '../../types';
import { evaluationService } from '../../services/evaluation.service';
import { studentService } from '../../services/student.service';

interface CreateEvaluationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (evaluation: Evaluation) => void;
  initialEvaluation?: Evaluation;
}

const CreateEvaluationDialog: React.FC<CreateEvaluationDialogProps> = ({
  open,
  onClose,
  onSave,
  initialEvaluation
}) => {
  const [formData, setFormData] = useState<Partial<Evaluation>>({
    name: '',
    subject: '',
    group: '',
    type: 'dissertation',
    date: format(new Date(), 'yyyy-MM-dd'),
    rubricId: '',
    maxPoints: 20,
    coefficient: 1,
    theme: '',
    copies: []
  });
  
  const [availableRubrics, setAvailableRubrics] = useState<Rubric[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Récupérer tous les barèmes
        const rubrics = evaluationService.getAllRubrics();
        setAvailableRubrics(rubrics);
        
        // Récupérer tous les groupes d'élèves
        const studentGroups = studentService.getAllStudentGroups();
        setAvailableGroups(studentGroups.map(group => group.group));
        
        // Si c'est une modification, charger les données existantes
        if (initialEvaluation) {
          setFormData(initialEvaluation);
          
          // Charger le barème sélectionné
          const rubric = evaluationService.getRubricById(initialEvaluation.rubricId);
          if (rubric) {
            setSelectedRubric(rubric);
          }
          
          // Charger les élèves du groupe
          if (initialEvaluation.group) {
            const students = studentService.getStudentsByGroup(initialEvaluation.group);
            setGroupStudents(students);
          }
        }
        
        setError(null);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Impossible de charger les données nécessaires. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      loadData();
    }
  }, [open, initialEvaluation]);
  
  // Gérer les changements de champs
  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Si le groupe change, charger les élèves correspondants
    if (field === 'group' && value) {
      const students = studentService.getStudentsByGroup(value);
      setGroupStudents(students);
    }
    
    // Si le barème change, mettre à jour le barème sélectionné et le nombre de points
    if (field === 'rubricId' && value) {
      const rubric = evaluationService.getRubricById(value);
      if (rubric) {
        setSelectedRubric(rubric);
        setFormData(prev => ({
          ...prev,
          maxPoints: rubric.totalPoints
        }));
      } else {
        setSelectedRubric(null);
      }
    }
  };
  
  // Créer l'évaluation
  const handleSave = () => {
    try {
      if (!formData.name || !formData.subject || !formData.group || !formData.rubricId) {
        setError("Veuillez remplir tous les champs obligatoires");
        return;
      }
      
      if (groupStudents.length === 0) {
        setError("Aucun élève n'est associé à ce groupe");
        return;
      }
      
      // Préparer les copies pour chaque élève
      const copies = groupStudents.map(student => ({
        studentId: student.id,
        grade: null,
        comments: '',
        details: []
      }));
      
      // Créer ou mettre à jour l'évaluation
      if (initialEvaluation) {
        // Mise à jour
        const updatedEvaluation = evaluationService.updateEvaluation({
          ...initialEvaluation,
          ...formData,
          copies: initialEvaluation.copies // Conserver les copies existantes
        } as Evaluation);
        
        onSave(updatedEvaluation);
      } else {
        // Création
        const newEvaluation = evaluationService.createEvaluation({
          ...formData,
          copies
        } as Evaluation);
        
        onSave(newEvaluation);
      }
      
      // Fermer le dialogue
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'évaluation:", error);
      setError("Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.");
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialEvaluation ? "Modifier l'évaluation" : "Créer une nouvelle évaluation"}
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {/* Nom de l'évaluation */}
              <Grid item xs={12}>
                <TextField
                  label="Nom de l'évaluation"
                  fullWidth
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </Grid>
              
              {/* Matière et groupe */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Matière"
                  fullWidth
                  required
                  value={formData.subject || ''}
                  onChange={(e) => handleChange('subject', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Groupe d'élèves</InputLabel>
                  <Select
                    value={formData.group || ''}
                    onChange={(e) => handleChange('group', e.target.value)}
                    label="Groupe d'élèves"
                  >
                    <MenuItem value="">Sélectionner un groupe</MenuItem>
                    {availableGroups.map(group => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Type d'évaluation et date */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type d'évaluation</InputLabel>
                  <Select
                    value={formData.type || 'dissertation'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    label="Type d'évaluation"
                  >
                    <MenuItem value="dissertation">Dissertation</MenuItem>
                    <MenuItem value="analyse">Analyse de texte</MenuItem>
                    <MenuItem value="controle">Contrôle de connaissances</MenuItem>
                    <MenuItem value="oral">Évaluation orale</MenuItem>
                    <MenuItem value="projet">Projet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date de l'évaluation"
                  type="date"
                  fullWidth
                  required
                  value={formData.date || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => handleChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              {/* Barème */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Barème</InputLabel>
                  <Select
                    value={formData.rubricId || ''}
                    onChange={(e) => handleChange('rubricId', e.target.value)}
                    label="Barème"
                  >
                    <MenuItem value="">Sélectionner un barème</MenuItem>
                    {availableRubrics.map(rubric => (
                      <MenuItem key={rubric.id} value={rubric.id}>
                        {rubric.name} ({rubric.totalPoints} points)
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Le barème détermine les critères d'évaluation
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              {/* Points et coefficient */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Points maximum"
                  type="number"
                  fullWidth
                  required
                  value={formData.maxPoints || 20}
                  onChange={(e) => handleChange('maxPoints', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Coefficient"
                  type="number"
                  fullWidth
                  required
                  value={formData.coefficient || 1}
                  onChange={(e) => handleChange('coefficient', parseFloat(e.target.value))}
                  InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
                />
              </Grid>
              
              {/* Thème */}
              <Grid item xs={12}>
                <TextField
                  label="Thème ou sujet"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.theme || ''}
                  onChange={(e) => handleChange('theme', e.target.value)}
                />
              </Grid>
              
              {/* Aperçu des élèves concernés */}
              {groupStudents.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Élèves concernés ({groupStudents.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {groupStudents.map(student => (
                      <Chip 
                        key={student.id}
                        label={`${student.lastName} ${student.firstName}`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {/* Aperçu du barème */}
              {selectedRubric && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Aperçu du barème : {selectedRubric.name}
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    {selectedRubric.criteria.map(criterion => (
                      <Box key={criterion.id} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {criterion.name} - {criterion.points} points
                        </Typography>
                        {criterion.subCriteria && criterion.subCriteria.length > 0 && (
                          <Box sx={{ ml: 2 }}>
                            {criterion.subCriteria.map(subCriterion => (
                              <Typography key={subCriterion.id} variant="body2" color="text.secondary">
                                • {subCriterion.name} - {subCriterion.points} points
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading || !formData.name || !formData.subject || !formData.group || !formData.rubricId}
        >
          {initialEvaluation ? "Mettre à jour" : "Créer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEvaluationDialog;