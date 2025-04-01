// src/components/correction/EvaluationDeleteDialog.tsx

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

interface EvaluationDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  evaluationName: string;
  hasGrades: boolean;
}

const EvaluationDeleteDialog: React.FC<EvaluationDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  evaluationName,
  hasGrades
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
            Êtes-vous sûr de vouloir supprimer l'évaluation <strong>"{evaluationName}"</strong> ?
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cette action est irréversible et toutes les données associées à cette évaluation seront perdues.
        </Typography>
        
        {hasGrades && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Attention:</strong> Cette évaluation contient déjà des notes. Sa suppression entraînera la perte définitive de toutes les notes saisies.
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

export default EvaluationDeleteDialog;