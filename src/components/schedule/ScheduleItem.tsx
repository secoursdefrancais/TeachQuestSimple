// src/components/schedule/ScheduleItem.tsx

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tooltip 
} from '@mui/material';
import { ScheduleClass } from '../../services/schedule.service';

interface ScheduleItemProps {
  classItem: ScheduleClass;
  hourHeight?: number; // Optionnel, utilisé uniquement pour l'emploi du temps
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ classItem, hourHeight }) => {
  // Obtenir une couleur basée sur la matière
  const getSubjectColor = (subject: string): string => {
    const colors: Record<string, string> = {
      'CULTURE GENE.ET EXPR': '#4caf50',
      'FRANCAIS': '#2196f3',
      'AP FRANCAIS': '#9c27b0',
      'AT. PROFESSIONNALIS.': '#ff9800',
      'ATELIER PROFESS': '#ff9800', // Alias possible
      'default': '#757575'  // Couleur par défaut
    };
    
    return colors[subject] || colors['default'];
  };
  
  // Si hourHeight est défini, on est dans l'emploi du temps et on calcule la hauteur
  // Sinon on est dans le planning et on utilise une hauteur fixe
  const getItemHeight = () => {
    if (hourHeight) {
      // Calcul pour l'emploi du temps
      const startParts = classItem.startTime.split(':').map(Number);
      const endParts = classItem.endTime.split(':').map(Number);
      
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      const durationMinutes = endMinutes - startMinutes;
      return (durationMinutes / 60) * hourHeight;
    } else {
      // Hauteur fixe pour le planning
      return 70;
    }
  };
  
  return (
    <Paper 
      sx={{ 
        p: 1, 
        mb: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: `${getItemHeight()}px`,
        borderLeft: `4px solid ${getSubjectColor(classItem.subject)}`,
        overflow: 'hidden', // Évite le débordement du contenu
        boxSizing: 'border-box',
        bgcolor: '#fafafa',
        '&:hover': {
          bgcolor: '#f0f0f0',
          boxShadow: 2
        }
      }}
      elevation={1}
    >
      <Tooltip title={`${classItem.subject}${classItem.note ? ` - ${classItem.note}` : ''}`}>
        <Typography 
          variant="body2" 
          fontWeight="medium"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {classItem.subject}
        </Typography>
      </Tooltip>
      
      <Typography 
        variant="caption" 
        color="text.secondary"
        sx={{
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {classItem.group} {classItem.room && `• ${classItem.room}`}
      </Typography>
      
      <Box sx={{ mt: 'auto' }}>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'block' }}
        >
          {classItem.startTime} - {classItem.endTime}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ScheduleItem;