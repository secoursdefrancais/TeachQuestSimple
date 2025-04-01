// src/components/schedule/ScheduleClassEditor.tsx

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
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Typography,
  FormHelperText
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { studentService } from '../../services/student.service';
import { Subject } from '../../types';

interface ScheduleClassEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (scheduleItem: any) => void;
  scheduleItem?: any;
}

const DAYS_OF_WEEK = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche'
];

const SUBJECT_OPTIONS: Subject[] = [
  "CULTURE GENE.ET EXPR",
  "FRANCAIS",
  "AP FRANCAIS",
  "ATELIER PROFESS"
];

const ScheduleClassEditor: React.FC<ScheduleClassEditorProps> = ({
  open,
  onClose,
  onSave,
  scheduleItem
}) => {
  const [formData, setFormData] = useState({
    id: '',
    day: 'lundi',
    subject: '',
    group: '',
    room: '',
    startTime: '08:00',
    endTime: '10:00',
    alternating: false,
    weekType: 'odd',
    note: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentGroups, setStudentGroups] = useState<string[]>([]);
  
  // Charger les groupes d'élèves
  useEffect(() => {
    try {
      const groups = studentService.getAllStudentGroups();
      setStudentGroups(groups.map(g => g.group));
    } catch (error) {
      console.error("Erreur lors du chargement des groupes:", error);
    }
  }, []);
  
  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (scheduleItem) {
      setFormData({
        id: scheduleItem.id || '',
        day: scheduleItem.day || 'lundi',
        subject: scheduleItem.subject || '',
        group: scheduleItem.group || '',
        room: scheduleItem.room || '',
        startTime: scheduleItem.startTime || '08:00',
        endTime: scheduleItem.endTime || '10:00',
        alternating: scheduleItem.alternating || false,
        weekType: scheduleItem.weekType || 'odd',
        note: scheduleItem.note || ''
      });
    } else {
      // Réinitialiser le formulaire pour une nouvelle entrée
      setFormData({
        id: '',
        day: 'lundi',
        subject: '',
        group: '',
        room: '',
        startTime: '08:00',
        endTime: '10:00',
        alternating: false,
        weekType: 'odd',
        note: ''
      });
    }
    
    // Réinitialiser les erreurs
    setErrors({});
  }, [scheduleItem, open]);
  
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
    
    if (!formData.subject) newErrors.subject = "Veuillez sélectionner une matière";
    if (!formData.group) newErrors.group = "Veuillez sélectionner un groupe";
    if (!formData.startTime) newErrors.startTime = "Veuillez définir l'heure de début";
    if (!formData.endTime) newErrors.endTime = "Veuillez définir l'heure de fin";
    
    // Vérifier que l'heure de fin est postérieure à l'heure de début
    if (formData.startTime && formData.endTime) {
      const start = formData.startTime.split(':').map(Number);
      const end = formData.endTime.split(':').map(Number);
      
      if (start[0] > end[0] || (start[0] === end[0] && start[1] >= end[1])) {
        newErrors.endTime = "L'heure de fin doit être postérieure à l'heure de début";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Préparer les données pour la sauvegarde
    const scheduleData = {
      ...formData,
      id: formData.id || uuidv4() // Générer un ID si c'est une nouvelle entrée
    };
    
    onSave(scheduleData);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {scheduleItem ? 'Modifier un cours' : 'Ajouter un cours'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Jour de la semaine */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.day}>
              <InputLabel>Jour</InputLabel>
              <Select
                value={formData.day}
                label="Jour"
                onChange={(e) => handleChange('day', e.target.value)}
              >
                {DAYS_OF_WEEK.map(day => (
                  <MenuItem key={day} value={day} sx={{ textTransform: 'capitalize' }}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
              {errors.day && <FormHelperText>{errors.day}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* Matière */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.subject}>
              <InputLabel>Matière</InputLabel>
              <Select
                value={formData.subject}
                label="Matière"
                onChange={(e) => handleChange('subject', e.target.value)}
              >
                <MenuItem value="">Sélectionner une matière</MenuItem>
                {SUBJECT_OPTIONS.map(subject => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
                <MenuItem value="AUTRE">Autre...</MenuItem>
              </Select>
              {errors.subject && <FormHelperText>{errors.subject}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* Groupe */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.group}>
              <InputLabel>Groupe</InputLabel>
              <Select
                value={formData.group}
                label="Groupe"
                onChange={(e) => handleChange('group', e.target.value)}
              >
                <MenuItem value="">Sélectionner un groupe</MenuItem>
                {studentGroups.map(group => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
              {errors.group && <FormHelperText>{errors.group}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* Salle */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Salle"
              fullWidth
              value={formData.room}
              onChange={(e) => handleChange('room', e.target.value)}
              placeholder="Exemple: B203"
            />
          </Grid>
          
          {/* Horaires */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Heure de début"
              type="time"
              fullWidth
              required
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              error={!!errors.startTime}
              helperText={errors.startTime}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Heure de fin"
              type="time"
              fullWidth
              required
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              error={!!errors.endTime}
              helperText={errors.endTime}
            />
          </Grid>
          
          {/* Alternance */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.alternating}
                  onChange={(e) => handleChange('alternating', e.target.checked)}
                />
              }
              label="Cours en alternance (une semaine sur deux)"
            />
          </Grid>
          
          {/* Type de semaine (si alternance) */}
          {formData.alternating && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type de semaine</InputLabel>
                <Select
                  value={formData.weekType}
                  label="Type de semaine"
                  onChange={(e) => handleChange('weekType', e.target.value)}
                >
                  <MenuItem value="odd">Semaines impaires</MenuItem>
                  <MenuItem value="even">Semaines paires</MenuItem>
                </Select>
                <FormHelperText>
                  Indique si ce cours a lieu les semaines paires ou impaires
                </FormHelperText>
              </FormControl>
            </Grid>
          )}
          
          {/* Note */}
          <Grid item xs={12}>
            <TextField
              label="Note (facultative)"
              fullWidth
              multiline
              rows={2}
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Informations supplémentaires sur ce cours"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {scheduleItem ? 'Mettre à jour' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleClassEditor;