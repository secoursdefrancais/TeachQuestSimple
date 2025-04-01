// src/components/tasks/TaskDialog.tsx

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
  Slider,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { Task, TaskCategory } from '../../types';
import { taskService } from '../../services/task.service';
import { studentService } from '../../services/student.service';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task;
  initialDate?: Date | null;
}

// Interface pour le formulaire interne
interface TaskFormData {
  name: string;
  description: string;
  categoryId: number;
  dueDate: string;
  singleGroup: string; // Champ temporaire pour le formulaire
  relatedSubject: string;
  priority: number;
  estimatedTime: number;
  notes?: string;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  initialTask,
  initialDate
}) => {
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    categoryId: 0,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    singleGroup: '',
    relatedSubject: '',
    priority: 3,
    estimatedTime: 30
  });
  const [xpPreview, setXpPreview] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les catégories de tâches et les groupes disponibles
  useEffect(() => {
    try {
      // Récupérer toutes les catégories
      const allCategories = taskService.getTaskCategories();
      
      // Filtrer la catégorie "Correction de copies" (id=2)
      const filteredCategories = allCategories.filter(cat => cat.id !== 2);
      
      setTaskCategories(filteredCategories);
      
      const studentGroups = studentService.getAllStudentGroups();
      setAvailableGroups(studentGroups.map(group => group.group));
      
      // Initialiser avec les données de la tâche existante ou par défaut
      if (initialTask) {
        setFormData({
          name: initialTask.name || '',
          description: initialTask.description || '',
          categoryId: initialTask.categoryId || 0,
          dueDate: initialTask.dueDate || format(new Date(), 'yyyy-MM-dd'),
          singleGroup: initialTask.relatedGroups && initialTask.relatedGroups.length > 0 
            ? initialTask.relatedGroups[0] 
            : '',
          relatedSubject: initialTask.relatedSubject || '',
          priority: initialTask.priority || 3,
          estimatedTime: initialTask.estimatedTime || 30,
          notes: initialTask.notes
        });
        
        const category = filteredCategories.find(cat => cat.id === initialTask.categoryId);
        if (category) {
          setSelectedCategory(category);
          updateXpPreview(category);
        }
      } else if (initialDate) {
        setFormData(prev => ({
          ...prev,
          dueDate: format(initialDate, 'yyyy-MM-dd')
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError("Impossible de charger les catégories ou les groupes");
    }
  }, [initialTask, initialDate]);
  
  // Mettre à jour l'aperçu des points XP lorsque la catégorie change
  const updateXpPreview = (category: TaskCategory) => {
    const xp = taskService.calculateTaskPoints(
      category.xpValue,
      category.estimeValue,
      category.plaisirValue
    );
    setXpPreview(xp);
  };
  
  // Gérer les changements de champs du formulaire
  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gérer le changement de catégorie
  const handleCategoryChange = (categoryId: number) => {
    const category = taskCategories.find(cat => cat.id === categoryId);
    
    if (category) {
      setSelectedCategory(category);
      updateXpPreview(category);
      
      handleChange('categoryId', categoryId);
    }
  };
  
  // Préparer les données avant l'enregistrement
  const prepareDataForSave = (): Partial<Task> | null => {
    // Vérifier les champs obligatoires
    if (!formData.name || !formData.categoryId || !formData.dueDate) {
      setError("Veuillez remplir tous les champs obligatoires");
      return null;
    }
    
    // Convertir le formulaire interne en objet Task
    const taskToSave: Partial<Task> = {
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      dueDate: formData.dueDate,
      relatedGroups: formData.singleGroup ? [formData.singleGroup] : [],
      relatedSubject: formData.relatedSubject,
      priority: formData.priority,
      estimatedTime: formData.estimatedTime,
      notes: formData.notes || '',
      earnedXP: selectedCategory ? xpPreview : 0
    };
    
    return taskToSave;
  };
  
  // Enregistrer la tâche
  const handleSave = () => {
    const taskToSave = prepareDataForSave();
    
    if (taskToSave) {
      onSave(taskToSave);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          {/* Titre de la tâche */}
          <Grid item xs={12}>
            <TextField
              label="Titre de la tâche"
              fullWidth
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>
          
          {/* Description */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              multiline
              rows={2}
              fullWidth
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>
          
          {/* Catégorie */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={formData.categoryId || ''}
                onChange={(e) => handleCategoryChange(e.target.value as number)}
                label="Catégorie"
              >
                {taskCategories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Pour créer une évaluation à corriger, utilisez le bouton "Créer une évaluation"
              </FormHelperText>
            </FormControl>
          </Grid>
          
          {/* Date d'échéance */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Date d'échéance"
              type="date"
              fullWidth
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          
          {/* Priorité */}
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Priorité
            </Typography>
            <Slider
              value={formData.priority}
              onChange={(e, value) => handleChange('priority', value)}
              step={1}
              marks
              min={1}
              max={5}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => {
                const labels: Record<number, string> = {
                  1: 'Très haute',
                  2: 'Haute',
                  3: 'Moyenne',
                  4: 'Basse',
                  5: 'Très basse'
                };
                return labels[value as number] || '';
              }}
            />
          </Grid>
          
          {/* Temps estimé */}
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Temps estimé (minutes)
            </Typography>
            <Slider
              value={formData.estimatedTime}
              onChange={(e, value) => handleChange('estimatedTime', value)}
              step={10}
              marks
              min={10}
              max={120}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          {/* Matière concernée */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Matière concernée"
              fullWidth
              value={formData.relatedSubject}
              onChange={(e) => handleChange('relatedSubject', e.target.value)}
            />
          </Grid>
          
          {/* Groupe concerné */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Groupe concerné</InputLabel>
              <Select
                value={formData.singleGroup || ''}
                onChange={(e) => handleChange('singleGroup', e.target.value)}
                label="Groupe concerné"
              >
                <MenuItem value="">Aucun groupe spécifique</MenuItem>
                {availableGroups.map(group => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Aperçu de gamification */}
          {selectedCategory && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Détails de gamification
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Base XP: {selectedCategory.xpValue}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Estime: {selectedCategory.estimeValue}/10
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Plaisir: {selectedCategory.plaisirValue}/10
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Formule: <code>XP * (1 + (Estime * 0.7/10) - (Plaisir * -0.3/10))</code>
                  </Typography>
                  <Chip 
                    label={`Cette tâche rapportera ${xpPreview} XP`}
                    color="primary"
                  />
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!formData.name || !formData.categoryId || !formData.dueDate}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};