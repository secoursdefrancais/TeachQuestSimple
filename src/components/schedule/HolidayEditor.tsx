// src/components/schedule/HolidayEditor.tsx

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
  FormHelperText
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface HolidayEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (holiday: any) => void;
  holiday?: any;
}

const HOLIDAY_TYPES = [
  { value: 'bankHoliday', label: 'Jour férié national' },
  { value: 'localHoliday', label: 'Jour férié local' },
  { value: 'schoolHoliday', label: 'Jour férié scolaire' },
  { value: 'other', label: 'Autre' }
];

const HolidayEditor: React.FC<HolidayEditorProps> = ({
  open,
  onClose,
  onSave,
  holiday
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'bankHoliday',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (holiday) {
      setFormData({
        id: holiday.id || '',
        name: holiday.name || '',
        date: holiday.date || format(new Date(), 'yyyy-MM-dd'),
        type: holiday.type || 'bankHoliday',
        description: holiday.description || ''
      });
    } else {
      // Réinitialiser le formulaire pour une nouvelle entrée
      setFormData({
        id: '',
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'bankHoliday',
        description: ''
      });
    }
    
    // Réinitialiser les erreurs
    setErrors({});
  }, [holiday, open]);
  
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
    if (!formData.date) newErrors.date = "Veuillez sélectionner une date";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Préparer les données pour la sauvegarde
    const holidayData = {
      ...formData,
      id: formData.id || uuidv4() // Générer un ID si c'est une nouvelle entrée
    };
    
    onSave(holidayData);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {holiday ? 'Modifier un jour férié' : 'Ajouter un jour férié'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Nom du jour férié */}
          <Grid item xs={12}>
            <TextField
              label="Nom du jour férié"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="Ex: Lundi de Pâques"
            />
          </Grid>
          
          {/* Date */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={!!errors.date}
              helperText={errors.date}
            />
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
                {HOLIDAY_TYPES.map(type => (
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
              placeholder="Informations supplémentaires sur ce jour férié"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {holiday ? 'Mettre à jour' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HolidayEditor;