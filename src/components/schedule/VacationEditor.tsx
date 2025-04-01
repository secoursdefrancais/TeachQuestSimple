// src/components/schedule/VacationEditor.tsx

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
  Grid,
  Box,
  Typography,
  FormHelperText,
  Chip
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, parseISO } from 'date-fns';

interface VacationEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (vacation: any) => void;
  vacation?: any;
}

const VACATION_TYPES = [
  { value: 'vacation', label: 'Vacances scolaires' },
  { value: 'holiday', label: 'Jour férié prolongé' },
  { value: 'closure', label: 'Fermeture établissement' },
  { value: 'other', label: 'Autre période' }
];

const VacationEditor: React.FC<VacationEditorProps> = ({
  open,
  onClose,
  onSave,
  vacation
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'vacation',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (vacation) {
      setFormData({
        id: vacation.id || '',
        name: vacation.name || '',
        startDate: vacation.startDate || format(new Date(), 'yyyy-MM-dd'),
        endDate: vacation.endDate || format(new Date(), 'yyyy-MM-dd'),
        type: vacation.type || 'vacation',
        description: vacation.description || ''
      });
    } else {
      // Réinitialiser le formulaire pour une nouvelle entrée
      setFormData({
        id: '',
        name: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        type: 'vacation',
        description: ''
      });
    }
    
    // Réinitialiser les erreurs
    setErrors({});
  }, [vacation, open]);
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = "Veuillez saisir un nom";
    if (!formData.startDate) newErrors.startDate = "Veuillez sélectionner une date de début";
    if (!formData.endDate) newErrors.endDate = "Veuillez sélectionner une date de fin";
    
    // Vérifier que la date de fin est postérieure à la date de début
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        newErrors.endDate = "La date de fin doit être postérieure à la date de début";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Préparer les données pour la sauvegarde
    const vacationData = {
      ...formData,
      id: formData.id || uuidv4() // Générer un ID si c'est une nouvelle entrée
    };
    
    onSave(vacationData);
  };
  
  // Calculer la durée en jours
  const calculateDuration = (): number => {
    try {
      if (!formData.startDate || !formData.endDate) return 0;
      
      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      
      return differenceInDays(end, start) + 1; // +1 pour inclure le jour de fin
    } catch (error) {
      console.error("Erreur lors du calcul de la durée:", error);
      return 0;
    }
  };
  
  const duration = calculateDuration();
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {vacation ? 'Modifier une période de vacances' : 'Ajouter une période de vacances'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Nom des vacances */}
          <Grid item xs={12}>
            <TextField
              label="Nom de la période"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="Ex: Vacances de Noël"
            />
          </Grid>
          
          {/* Dates */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Date de début"
              type="date"
              fullWidth
              required
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Date de fin"
              type="date"
              fullWidth
              required
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={!!errors.endDate}
              helperText={errors.endDate}
            />
          </Grid>
          
          {/* Durée (affichage) */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Durée:
              </Typography>
              <Chip 
                label={`${duration} jour${duration > 1 ? 's' : ''}`} 
                color="primary" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Grid>
          
          {/* Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {VACATION_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Description */}
          <Grid item xs={12}>
            <TextField
              label="Description (facultative)"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Informations supplémentaires sur cette période"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {vacation ? 'Mettre à jour' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VacationEditor;