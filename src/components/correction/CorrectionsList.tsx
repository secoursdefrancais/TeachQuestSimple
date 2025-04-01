// src/components/correction/CorrectionsList.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  Fab,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreateIcon from '@mui/icons-material/Create';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Evaluation, AppView } from '../../types';
import { evaluationService } from '../../services/evaluation.service';
import CorrectionView from './CorrectionView';
import EvaluationResultsView from './EvaluationResultsView';
import CreateEvaluationDialog from './CreateEvaluationDialog';
import EvaluationDeleteDialog from './EvaluationDeleteDialog';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

type CorrectionMode = 'list' | 'correction' | 'results';

interface CorrectionsListProps {
  onNavigate?: (view: AppView) => void;
}

const CorrectionsList: React.FC<CorrectionsListProps> = ({ onNavigate }) => {

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<CorrectionMode>('list');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(null);  
  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const data = evaluationService.getAllEvaluations();
      setEvaluations(data);
      setError(null);
    } catch (error) {
      console.error("Erreur lors du chargement des évaluations:", error);
      setError("Impossible de charger les évaluations. Veuillez rafraîchir la page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger toutes les évaluations au démarrage
    loadEvaluations();
  }, []);

  // Calculer le taux de progression pour chaque évaluation
  const getProgress = (evaluation: Evaluation): number => {
    if (!evaluation.copies || evaluation.copies.length === 0) {
      return 0;
    }

    const correctedCopies = evaluation.copies.filter(copy => copy.grade !== null);
    return (correctedCopies.length / evaluation.copies.length) * 100;
  };

  // Démarrer la correction d'une évaluation
  const handleStartGrading = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setMode('correction');
  };

  // Voir les résultats d'une évaluation
  const handleShowResults = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setMode('results');
  };

  // Retour à la liste
  const handleBackToList = () => {
    setMode('list');
    setSelectedEvaluationId(undefined);
    // Recharger les évaluations pour voir les mises à jour
    loadEvaluations();
  };

  // Fermer le dialogue de création d'évaluation
  const handleCloseCreateDialog = () => {
    setIsDialogOpen(false);
  };

  // Modifier la fonction qui ouvre le dialogue de création d'évaluation
  const handleOpenCreateDialog = () => {
    setEditingEvaluation(null); // S'assurer qu'on crée une nouvelle évaluation
    setIsDialogOpen(true);
  };

  // Gérer la création d'une nouvelle évaluation
  const handleSaveEvaluation = (evaluation: Evaluation) => {
    try {
      if (editingEvaluation) {
        // Mise à jour d'une évaluation existante
        evaluationService.updateEvaluation(evaluation);
        setEditingEvaluation(null);

        // Mettre à jour la liste
        setEvaluations(prevEvaluations =>
          prevEvaluations.map(e =>
            e.id === evaluation.id ? evaluation : e
          )
        );

        setError("Évaluation mise à jour avec succès.");
      } else {
        // Création d'une nouvelle évaluation
        const newEvaluation = evaluationService.createEvaluation(evaluation);

        // Ajouter à la liste
        setEvaluations([...evaluations, newEvaluation]);

        setError("Évaluation créée avec succès. Cliquez sur 'Commencer la correction' pour débuter.");
      }

      setIsDialogOpen(false);
      setTimeout(() => setError(null), 5000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'évaluation:", error);
      setError("Impossible de sauvegarder l'évaluation. Veuillez réessayer.");
    }
  };

  // Ouvrir le menu d'options pour une évaluation
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, evaluationId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveEvaluationId(evaluationId);
  };

  // Fermer le menu d'options
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setActiveEvaluationId(null);
  };

  // Ouvrir le dialogue d'édition pour une évaluation
  const handleEditEvaluation = () => {
    if (!activeEvaluationId) return;

    const evaluation = evaluations.find(e => e.id === activeEvaluationId);
    if (!evaluation) return;

    // Vérifier si l'évaluation a déjà des notes
    const hasGrades = evaluation.copies.some(copy => copy.grade !== null);
    if (hasGrades) {
      setError("Impossible de modifier une évaluation qui a déjà des notes. Vous pouvez créer une nouvelle évaluation similaire.");
      setTimeout(() => setError(null), 5000);
      handleCloseMenu();
      return;
    }

    setEditingEvaluation(evaluation);
    setIsDialogOpen(true);
    handleCloseMenu();
  };

  // Ouvrir le dialogue de suppression pour une évaluation
  const handleDeleteClick = () => {
    if (!activeEvaluationId) return;

    const evaluation = evaluations.find(e => e.id === activeEvaluationId);
    if (!evaluation) return;

    setEvaluationToDelete(evaluation);
    setIsDeleteDialogOpen(true);
    handleCloseMenu();
  };

  // Confirmer la suppression d'une évaluation
  const confirmDeleteEvaluation = () => {
    if (!evaluationToDelete) return;

    try {
      evaluationService.deleteEvaluation(evaluationToDelete.id);
      loadEvaluations(); // Recharger la liste des évaluations

      setError("Évaluation supprimée avec succès.");
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'évaluation:", error);
      setError("Erreur lors de la suppression de l'évaluation. Veuillez réessayer.");
    } finally {
      setIsDeleteDialogOpen(false);
      setEvaluationToDelete(null);
    }
  };

  // Filtrer les évaluations par état (à corriger, en cours, terminées)
  const pendingEvaluations = evaluations.filter(e => getProgress(e) === 0);
  const inProgressEvaluations = evaluations.filter(e => getProgress(e) > 0 && getProgress(e) < 100);
  const completedEvaluations = evaluations.filter(e => getProgress(e) === 100);

  // Si on est en mode correction, afficher la vue de correction
  if (mode === 'correction' && selectedEvaluationId) {
    return (
      <CorrectionView
        evaluationId={selectedEvaluationId}
        onClose={handleBackToList}
        onShowResults={handleShowResults}
      />
    );
  }

  // Si on est en mode résultats, afficher la vue des résultats
  if (mode === 'results' && selectedEvaluationId) {
    return (
      <EvaluationResultsView
        evaluationId={selectedEvaluationId}
        onClose={handleBackToList}
      />
    );
  }

  // Afficher la liste des évaluations
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Copies à corriger
        </Typography>

        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          onClick={handleOpenCreateDialog}
        >
          Créer une évaluation
        </Button>
      </Box>

      {error && (
        <Alert
          severity={error.includes("succès") ? "success" : "error"}
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {evaluations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Aucune évaluation n'est disponible pour le moment.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            startIcon={<CreateIcon />}
            onClick={handleOpenCreateDialog}
          >
            Créer une évaluation
          </Button>
        </Paper>
      ) : (
        <>
          {/* Section: Évaluations à corriger */}
          {pendingEvaluations.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CreateIcon sx={{ mr: 1 }} /> À corriger
              </Typography>
              <Grid container spacing={2}>
                {pendingEvaluations.map(evaluation => (
                  <Grid item xs={12} md={6} lg={4} key={evaluation.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div" noWrap>
                            {evaluation.name}
                          </Typography>
                          <Chip
                            label={`${evaluation.copies.length} copies`}
                            size="small"
                            color="primary"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {evaluation.subject} - {evaluation.group}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                          <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(evaluation.date), 'dd MMMM yyyy', { locale: fr })}
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={getProgress(evaluation)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progression
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getProgress(evaluation).toFixed(0)}%
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleStartGrading(evaluation.id)}
                          startIcon={<CreateIcon />}
                          fullWidth
                        >
                          Commencer la correction
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Section: Corrections en cours */}
          {inProgressEvaluations.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1 }} /> Corrections en cours
              </Typography>
              <Grid container spacing={2}>
                {inProgressEvaluations.map(evaluation => (
                  <Grid item xs={12} md={6} lg={4} key={evaluation.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div" noWrap>
                            {evaluation.name}
                          </Typography>
                          <Chip
                            label={`${evaluation.copies.filter(c => c.grade !== null).length}/${evaluation.copies.length}`}
                            size="small"
                            color="secondary"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {evaluation.subject} - {evaluation.group}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                          <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(evaluation.date), 'dd MMMM yyyy', { locale: fr })}
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={getProgress(evaluation)}
                          sx={{ height: 8, borderRadius: 4, bgcolor: '#e1f5fe' }}
                          color="secondary"
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progression
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getProgress(evaluation).toFixed(0)}%
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => handleStartGrading(evaluation.id)}
                          fullWidth
                        >
                          Continuer la correction
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Section: Corrections terminées */}
          {completedEvaluations.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ mr: 1 }} /> Corrections terminées
              </Typography>
              <Grid container spacing={2}>
                {completedEvaluations.map(evaluation => (
                  <Grid item xs={12} md={6} lg={4} key={evaluation.id}>
                    <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div" noWrap>
                            {evaluation.name}
                          </Typography>
                          <Chip
                            label="Terminé"
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon />}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {evaluation.subject} - {evaluation.group}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                          <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(evaluation.date), 'dd MMMM yyyy', { locale: fr })}
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={100}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="success"
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {evaluation.copies.length} copies corrigées
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            100%
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => handleShowResults(evaluation.id)}
                          fullWidth
                        >
                          Voir les résultats
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Bouton flottant pour créer une évaluation */}
      <Tooltip title="Créer une évaluation">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          onClick={handleOpenCreateDialog}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Dialogue de création d'évaluation */}
      <CreateEvaluationDialog
        open={isDialogOpen}
        onClose={handleCloseCreateDialog}
        onSave={handleSaveEvaluation}
      />

      {/* Menu d'options pour les évaluations */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEditEvaluation}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Supprimer" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Dialogue de création/édition d'évaluation */}
      <CreateEvaluationDialog
        open={isDialogOpen}
        onClose={handleCloseCreateDialog}
        onSave={handleSaveEvaluation}
        initialEvaluation={editingEvaluation || undefined}
      />

      {/* Dialogue de confirmation de suppression */}
      <EvaluationDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteEvaluation}
        evaluationName={evaluationToDelete?.name || ''}
        hasGrades={Boolean(evaluationToDelete?.copies.some(copy => copy.grade !== null))}
      />
    </Box>

  );

};

export default CorrectionsList;