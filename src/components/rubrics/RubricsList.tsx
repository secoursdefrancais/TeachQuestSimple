// src/components/rubrics/RubricsList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import PreviewIcon from '@mui/icons-material/Preview';

import { evaluationService } from '../../services/evaluation.service';
import { Rubric } from '../../types';
import RubricEditor from './RubricEditor';

const RubricsList: React.FC = () => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  
  // État pour les dialogues
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRubric, setCurrentRubric] = useState<Rubric | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Charger les barèmes
  useEffect(() => {
    loadRubrics();
  }, []);
  
  const loadRubrics = () => {
    setLoading(true);
    try {
      const allRubrics = evaluationService.getAllRubrics();
      setRubrics(allRubrics);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des barèmes:", err);
      setError("Impossible de charger les barèmes. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrer les barèmes selon le texte de recherche
  const filteredRubrics = rubrics.filter(rubric => 
    rubric.name.toLowerCase().includes(filter.toLowerCase()) ||
    rubric.evaluationType.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Gérer la création d'un nouveau barème
  const handleCreateNew = () => {
    setCurrentRubric(null);
    setIsCreatingNew(true);
    setIsEditorOpen(true);
  };
  
  // Gérer l'édition d'un barème existant
  const handleEdit = (rubric: Rubric) => {
    setCurrentRubric(rubric);
    setIsCreatingNew(false);
    setIsEditorOpen(true);
  };
  
  // Gérer la suppression d'un barème
  const handleDeleteClick = (rubric: Rubric) => {
    setCurrentRubric(rubric);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!currentRubric) return;
    
    try {
      evaluationService.deleteRubric(currentRubric.id);
      loadRubrics();
    } catch (err) {
      console.error("Erreur lors de la suppression du barème:", err);
      setError("Impossible de supprimer le barème. Veuillez réessayer.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Gérer la duplication d'un barème
  const handleDuplicate = (rubric: Rubric) => {
    try {
      const duplicate = {
        ...rubric,
        id: '', // L'ID sera généré par le service
        name: `Copie de ${rubric.name}`,
        creationDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      
      evaluationService.saveRubric(duplicate);
      loadRubrics();
    } catch (err) {
      console.error("Erreur lors de la duplication du barème:", err);
      setError("Impossible de dupliquer le barème. Veuillez réessayer.");
    }
  };
  
  // Gérer la sauvegarde depuis l'éditeur
  const handleSaveRubric = (rubric: Rubric) => {
    try {
      evaluationService.saveRubric(rubric);
      setIsEditorOpen(false);
      loadRubrics();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du barème:", err);
      setError("Impossible de sauvegarder le barème. Veuillez réessayer.");
    }
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Barèmes d'évaluation
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Nouveau barème
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />
          <TextField
            label="Rechercher un barème"
            variant="outlined"
            size="small"
            fullWidth
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </Box>
        
        {filteredRubrics.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            {filter ? "Aucun barème ne correspond à votre recherche" : "Aucun barème disponible"}
          </Typography>
        ) : (
          <List>
            {filteredRubrics.map((rubric) => (
              <React.Fragment key={rubric.id}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{rubric.name}</Typography>
                        <Chip 
                          label={rubric.evaluationType}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {rubric.criteria.length} critères • {rubric.totalPoints} points • 
                          Dernière modification: {new Date(rubric.lastModified).toLocaleDateString()}
                        </Typography>
                        
                        {rubric.relatedClasses && rubric.relatedClasses.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {rubric.relatedClasses.map(className => (
                              <Chip 
                                key={className}
                                label={className}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Tooltip title="Prévisualiser">
                      <IconButton edge="end" sx={{ mr: 1 }}>
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Dupliquer">
                      <IconButton edge="end" sx={{ mr: 1 }} onClick={() => handleDuplicate(rubric)}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton edge="end" sx={{ mr: 1 }} onClick={() => handleEdit(rubric)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton edge="end" color="error" onClick={() => handleDeleteClick(rubric)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Dialogue de l'éditeur de barème */}
      <Dialog 
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {isCreatingNew ? "Créer un nouveau barème" : "Modifier le barème"}
        </DialogTitle>
        <DialogContent dividers>
          <RubricEditor 
            initialRubric={currentRubric} 
            onSave={handleSaveRubric}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le barème "{currentRubric?.name}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RubricsList;
