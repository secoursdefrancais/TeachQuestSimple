// src/components/tasks/TaskDeleteDialog.tsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface TaskDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskName: string;
  isStarted: boolean;
}

const TaskDeleteDialog: React.FC<TaskDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  taskName,
  isStarted
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Confirmer la suppression
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
          <Typography>
            Êtes-vous sûr de vouloir supprimer la tâche <strong>"{taskName}"</strong> ?
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cette action est irréversible et toutes les données associées à cette tâche seront perdues.
        </Typography>
        
        {isStarted && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Attention:</strong> Cette tâche a déjà été commencée. Sa suppression peut entraîner une perte de progression.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button 
          color="error" 
          variant="contained" 
          onClick={onConfirm}
        >
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDeleteDialog;