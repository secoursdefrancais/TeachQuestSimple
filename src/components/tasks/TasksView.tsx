// src/components/tasks/TasksView.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Divider,
  CircularProgress,
  LinearProgress,
  List,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PendingIcon from '@mui/icons-material/Pending';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateIcon from '@mui/icons-material/Create';
import { format, isAfter, isBefore, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Task, TaskCategory, Evaluation } from '../../types';
import { taskService } from '../../services/task.service';
import { evaluationService } from '../../services/evaluation.service';
import TaskItem from './TaskItem';
import { TaskDialog } from './TaskDialog';
import TaskDeleteDialog from './TaskDeleteDialog';
import CreateEvaluationDialog from '../correction/CreateEvaluationDialog';
import CorrectionView from '../correction/CorrectionView';
import EvaluationResultsView from '../correction/EvaluationResultsView';
import EvaluationDeleteDialog from '../correction/EvaluationDeleteDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tasks-tabpanel-${index}`}
      aria-labelledby={`tasks-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

type ViewMode = 'tasks' | 'correction' | 'results';

const TasksView: React.FC = () => {
  // États principaux
  const [tabValue, setTabValue] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'warning', message: string } | null>(null);

  // États pour les dialogues
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEvaluationDeleteDialogOpen, setIsEvaluationDeleteDialogOpen] = useState(false);

  // États pour les éléments sélectionnés
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | undefined>(undefined);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);

  // États pour le filtrage et le tri
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'name'>('dueDate');

  // États pour les menus contextuels
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(null);

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger toutes les tâches
        const allTasks = taskService.getAllTasks();
        setTasks(allTasks);
        
        // Charger les catégories de tâches
        const allCategories = taskService.getTaskCategories();
        setCategories(allCategories);
        
        // Charger les évaluations
        const allEvaluations = evaluationService.getAllEvaluations();
        setEvaluations(allEvaluations);
        
        setAlert(null);
      } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error);
        setAlert({
          type: 'error',
          message: "Impossible de charger les tâches. Veuillez rafraîchir la page."
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fonctions de filtrage et de tri
  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    // Filtrer par statut (onglet)
    if (tabValue === 0) { // À faire
      filtered = filtered.filter(task => task.status === 'pending');
    } else if (tabValue === 1) { // En cours
      filtered = filtered.filter(task => task.status === 'inProgress');
    } else if (tabValue === 2) { // Terminées
      filtered = filtered.filter(task => task.status === 'completed');
    }
    
    // Filtrer par catégorie
    if (categoryFilter !== '') {
      filtered = filtered.filter(task => task.categoryId === categoryFilter);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(query) || 
        task.description.toLowerCase().includes(query) ||
        (task.relatedSubject && task.relatedSubject.toLowerCase().includes(query))
      );
    }
    
    // Trier les tâches
    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      } else if (sortBy === 'priority') {
        return a.priority - b.priority;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  };
  
  // Grouper les tâches par date d'échéance
  const groupTasksByDueDate = (taskList: Task[]) => {
    const grouped: Record<string, Task[]> = {};
    
    taskList.forEach(task => {
      const dueDate = task.dueDate;
      if (!grouped[dueDate]) {
        grouped[dueDate] = [];
      }
      grouped[dueDate].push(task);
    });
    
    // Trier les dates
    return Object.keys(grouped)
      .sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime())
      .map(date => ({
        date,
        tasks: grouped[date]
      }));
  };
  
  // Récupérer les évaluations selon leur état
  const getEvaluationsToCorrect = () => {
    return evaluations.filter(e => {
      const progress = getEvaluationProgress(e);
      return progress < 100;
    });
  };
  
  const getCompletedEvaluations = () => {
    return evaluations.filter(e => {
      const progress = getEvaluationProgress(e);
      return progress === 100;
    });
  };
  
  // Calculer le taux de progression pour chaque évaluation
  const getEvaluationProgress = (evaluation: Evaluation): number => {
    if (!evaluation.copies || evaluation.copies.length === 0) {
      return 0;
    }
    
    const correctedCopies = evaluation.copies.filter(copy => copy.grade !== null);
    return (correctedCopies.length / evaluation.copies.length) * 100;
  };

  // Formater une date pour l'affichage
  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = addDays(today, 1);
    
    if (isBefore(date, today)) {
      return { text: `En retard - ${format(date, 'dd/MM/yyyy')}`, isLate: true };
    } else if (date.getTime() === today.getTime()) {
      return { text: "Aujourd'hui", isLate: false };
    } else if (date.getTime() === tomorrow.getTime()) {
      return { text: "Demain", isLate: false };
    } else {
      return { text: format(date, 'EEEE dd MMMM', { locale: fr }), isLate: false };
    }
  };

  // Handlers pour les changements d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handlers pour les dialogues de tâches
  const handleOpenTaskDialog = (task?: Task) => {
    // Si la tâche est fournie et qu'elle est déjà en cours ou terminée
    if (task && task.status !== 'pending') {
      setAlert({
        type: 'warning',
        message: "Une tâche déjà commencée ne peut pas être modifiée. Vous pouvez créer une nouvelle tâche similaire."
      });
      
      // Effacer l'alerte après 5 secondes
      setTimeout(() => setAlert(null), 5000);
      return;
    }
    
    setCurrentTask(task || null);
    setIsTaskDialogOpen(true);
  };
  
  const handleSaveTask = (taskData: Partial<Task>) => {
    try {
      if (currentTask) {
        // Mettre à jour une tâche existante
        const updatedTask = taskService.updateTask({
          ...currentTask,
          ...taskData
        } as Task);
        
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        
        setAlert({
          type: 'success',
          message: "Tâche mise à jour avec succès"
        });
      } else {
        // Créer une nouvelle tâche
        const newTask = taskService.createTask(taskData);
        
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        setAlert({
          type: 'success',
          message: "Tâche créée avec succès"
        });
      }
      
      setIsTaskDialogOpen(false);
      setCurrentTask(null);
      
      // Effacer l'alerte après 3 secondes
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la tâche:", error);
      setAlert({
        type: 'error',
        message: "Erreur lors de la sauvegarde de la tâche"
      });
    }
  };
  
  // Handlers pour la suppression des tâches
  const handleOpenDeleteDialog = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };
  
  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    
    try {
      taskService.deleteTask(taskToDelete.id);
      
      setTasks(prevTasks => 
        prevTasks.filter(task => task.id !== taskToDelete.id)
      );
      
      setAlert({
        type: 'success',
        message: "Tâche supprimée avec succès"
      });
      
      // Effacer l'alerte après 3 secondes
      setTimeout(() => setAlert(null), 3000);
      
      // Fermer le dialogue
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      setAlert({
        type: 'error',
        message: "Erreur lors de la suppression de la tâche"
      });
    }
  };
  
  const handleDeleteTask = (task: Task) => {
    // Ouvrir le dialogue de confirmation au lieu de supprimer directement
    handleOpenDeleteDialog(task);
  };

  // Handlers pour les évaluations
  const handleOpenCreateDialog = () => {
    setEditingEvaluation(null); // S'assurer qu'on crée une nouvelle évaluation
    setIsEvaluationDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setIsEvaluationDialogOpen(false);
    setEditingEvaluation(null);
  };
  
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
        
        setAlert({
          type: 'success',
          message: "Évaluation mise à jour avec succès."
        });
      } else {
        // Création d'une nouvelle évaluation
        const newEvaluation = evaluationService.createEvaluation(evaluation);
        
        // Ajouter à la liste
        setEvaluations([...evaluations, newEvaluation]);
        
        setAlert({
          type: 'success',
          message: "Évaluation créée avec succès. Cliquez sur 'Commencer la correction' pour débuter."
        });
      }
      
      setIsEvaluationDialogOpen(false);
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'évaluation:", error);
      setAlert({
        type: 'error',
        message: "Impossible de sauvegarder l'évaluation. Veuillez réessayer."
      });
    }
  };
  
  const handleStartGrading = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setViewMode('correction');
  };
  
  const handleShowResults = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setViewMode('results');
  };
  
  const handleBackToTasks = () => {
    setViewMode('tasks');
    
    // Recharger les évaluations pour voir les mises à jour
    try {
      const updatedEvaluations = evaluationService.getAllEvaluations();
      setEvaluations(updatedEvaluations);
    } catch (error) {
      console.error("Erreur lors du rechargement des évaluations:", error);
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
      setAlert({
        type: 'warning',
        message: "Impossible de modifier une évaluation qui a déjà des notes. Vous pouvez créer une nouvelle évaluation similaire."
      });
      setTimeout(() => setAlert(null), 5000);
      handleCloseMenu();
      return;
    }
    
    setEditingEvaluation(evaluation);
    setIsEvaluationDialogOpen(true);
    handleCloseMenu();
  };
  
  // Ouvrir le dialogue de suppression pour une évaluation
  const handleDeleteEvaluationClick = () => {
    if (!activeEvaluationId) return;
    
    const evaluation = evaluations.find(e => e.id === activeEvaluationId);
    if (!evaluation) return;
    
    setEvaluationToDelete(evaluation);
    setIsEvaluationDeleteDialogOpen(true);
    handleCloseMenu();
  };
  
  // Confirmer la suppression d'une évaluation
  const confirmDeleteEvaluation = () => {
    if (!evaluationToDelete) return;
    
    try {
      evaluationService.deleteEvaluation(evaluationToDelete.id);
      
      // Mettre à jour la liste des évaluations
      setEvaluations(prevEvaluations => 
        prevEvaluations.filter(e => e.id !== evaluationToDelete.id)
      );
      
      setAlert({
        type: 'success',
        message: "Évaluation supprimée avec succès."
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'évaluation:", error);
      setAlert({
        type: 'error',
        message: "Erreur lors de la suppression de l'évaluation. Veuillez réessayer."
      });
    } finally {
      setIsEvaluationDeleteDialogOpen(false);
      setEvaluationToDelete(null);
    }
  };
  
  // Handlers pour les filtres et le tri
  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };
  
  const handleOpenSortMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleCloseSortMenu = () => {
    setSortAnchorEl(null);
  };
  
  const handleCategoryFilterChange = (event: SelectChangeEvent<number | string>) => {
    setCategoryFilter(event.target.value as number | '');
    handleCloseFilterMenu();
  };
  
  const handleSortChange = (sortType: 'dueDate' | 'priority' | 'name') => {
    setSortBy(sortType);
    handleCloseSortMenu();
  };
  
  // Mettre à jour le statut d'une tâche
  const handleTaskUpdate = (task: Task, newStatus: 'pending' | 'inProgress' | 'completed') => {
    try {
      const updatedTask = {
        ...task,
        status: newStatus,
        completionDate: newStatus === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined
      };
      
      taskService.updateTask(updatedTask);
      
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id ? updatedTask : t
        )
      );
      
      setAlert({
        type: 'success',
        message: newStatus === 'completed' 
          ? "Tâche marquée comme terminée" 
          : "Statut de la tâche mis à jour"
      });
      
      // Effacer l'alerte après 3 secondes
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      setAlert({
        type: 'error',
        message: "Erreur lors de la mise à jour de la tâche"
      });
    }
  };
  
  // Si on est en mode correction
  if (viewMode === 'correction' && selectedEvaluationId) {
    return (
      <CorrectionView
        evaluationId={selectedEvaluationId}
        onClose={handleBackToTasks}
        onShowResults={handleShowResults}
      />
    );
  }
  
  // Si on est en mode résultats
  if (viewMode === 'results' && selectedEvaluationId) {
    return (
      <EvaluationResultsView
        evaluationId={selectedEvaluationId}
        onClose={handleBackToTasks}
      />
    );
  }
  
  // En mode liste des tâches
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByDueDate(filteredTasks);
  const evaluationsToCorrect = getEvaluationsToCorrect();
  const completedEvaluations = getCompletedEvaluations();
  
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Gestion des tâches
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={handleOpenCreateDialog}
            sx={{ mr: 1 }}
          >
            Créer une évaluation
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskDialog()}
          >
            Nouvelle tâche
          </Button>
        </Box>
      </Box>
      
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}
      
      {/* Évaluations à corriger - section compacte */}
      {evaluationsToCorrect.length > 0 && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Évaluations à corriger ({evaluationsToCorrect.length})
          </Typography>
          
          <Grid container spacing={2}>
            {evaluationsToCorrect.map(evaluation => {
              const progress = getEvaluationProgress(evaluation);
              const correctedCount = evaluation.copies.filter(c => c.grade !== null).length;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={evaluation.id}>
                  <Card variant="outlined">
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" noWrap sx={{ maxWidth: 200 }}>
                            {evaluation.name}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={(e) => handleOpenMenu(e, evaluation.id)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      subheader={
                        <Typography variant="body2" color="text.secondary">
                          {evaluation.subject} • {evaluation.group}
                        </Typography>
                      }
                    />
                    <CardContent sx={{ pt: 0, pb: 1 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {correctedCount}/{evaluation.copies.length} copies corrigées
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ height: 6, borderRadius: 3, my: 0.5 }}
                          color={progress > 0 ? "secondary" : "primary"}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        color={progress > 0 ? "secondary" : "primary"}
                        size="small"
                        fullWidth
                        onClick={() => handleStartGrading(evaluation.id)}
                      >
                        {progress > 0 ? "Continuer" : "Commencer"} la correction
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
      
      {/* Section principale des tâches */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="Statut des tâches"
            sx={{ flexGrow: 1 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PendingIcon sx={{ mr: 1, fontSize: 20 }} />
                  À faire
                </Box>
              } 
              id="tasks-tab-0" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} />
                  En cours
                </Box>
              } 
              id="tasks-tab-1" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                  Terminées
                </Box>
              } 
              id="tasks-tab-2" 
            />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mr: 1 }}
            />
            
            <Tooltip title="Filtrer">
              <IconButton 
                aria-label="filtrer" 
                onClick={handleOpenFilterMenu}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Trier">
              <IconButton 
                aria-label="trier" 
                onClick={handleOpenSortMenu}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Onglet des tâches à faire */}
        <TabPanel value={tabValue} index={0}>
          {groupedTasks.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Aucune tâche à faire
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => handleOpenTaskDialog()}
                sx={{ mt: 2 }}
              >
                Ajouter une tâche
              </Button>
            </Box>
          ) : (
            groupedTasks.map(group => {
              const { text, isLate } = formatDueDate(group.date);
              return (
                <Box key={group.date} sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 1, 
                      color: isLate ? 'error.main' : 'text.primary',
                      fontWeight: 'medium',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {isLate && <WarningIcon color="error" sx={{ mr: 1, fontSize: 20 }} />}
                    {text}
                  </Typography>
                  
                  <List sx={{ mb: 2 }}>
                    {group.tasks.map(task => (
                      <Box key={task.id} sx={{ mb: 1 }}>
                        <TaskItem 
                          task={task} 
                          onEdit={() => handleOpenTaskDialog(task)}
                          onStatusChange={(newStatus) => handleTaskUpdate(task, newStatus)}
                          onDelete={() => handleDeleteTask(task)}
                          displayCategory={getCategoryName(task.categoryId)}
                        />
                      </Box>
                    ))}
                  </List>
                  
                  <Divider sx={{ mt: 2 }} />
                </Box>
              );
            })
          )}
        </TabPanel>
        
        {/* Onglet des tâches en cours */}
        <TabPanel value={tabValue} index={1}>
          {groupedTasks.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Aucune tâche en cours
              </Typography>
            </Box>
          ) : (
            groupedTasks.map(group => {
              const { text, isLate } = formatDueDate(group.date);
              return (
                <Box key={group.date} sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 1, 
                      color: isLate ? 'error.main' : 'text.primary',
                      fontWeight: 'medium',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {isLate && <WarningIcon color="error" sx={{ mr: 1, fontSize: 20 }} />}
                    {text}
                  </Typography>
                  
                  <List>
                    {group.tasks.map(task => (
                      <Box key={task.id} sx={{ mb: 1 }}>
                        <TaskItem 
                          task={task} 
                          onEdit={() => handleOpenTaskDialog(task)}
                          onStatusChange={(newStatus) => handleTaskUpdate(task, newStatus)}
                          onDelete={() => handleDeleteTask(task)}
                          displayCategory={getCategoryName(task.categoryId)}
                        />
                      </Box>
                    ))}
                  </List>
                  
                  <Divider sx={{ mt: 2 }} />
                </Box>
              );
            })
          )}
        </TabPanel>
        
        {/* Onglet des tâches terminées */}
        <TabPanel value={tabValue} index={2}>
          {groupedTasks.length === 0 && completedEvaluations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Aucune tâche terminée
              </Typography>
            </Box>
          ) : (
            <>
              {groupedTasks.map(group => {
                const { text } = formatDueDate(group.date);
                return (
                  <Box key={group.date} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                      {text}
                    </Typography>
                    
                    <List>
                      {group.tasks.map(task => (
                        <Box key={task.id} sx={{ mb: 1 }}>
                          <TaskItem 
                            task={task} 
                            onEdit={() => handleOpenTaskDialog(task)}
                            onStatusChange={(newStatus) => handleTaskUpdate(task, newStatus)}
                            onDelete={() => handleDeleteTask(task)}
                            displayCategory={getCategoryName(task.categoryId)}
                          />
                        </Box>
                      ))}
                    </List>
                    
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                );
              })}
              
              {/* Section des évaluations terminées */}
              {completedEvaluations.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Évaluations terminées ({completedEvaluations.length})
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {completedEvaluations.map(evaluation => (
                      <Grid item xs={12} sm={6} md={4} key={evaluation.id}>
                        <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                          <CardHeader
                            title={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" noWrap sx={{ maxWidth: 200 }}>
                                  {evaluation.name}
                                </Typography>
                                <IconButton 
                                  size="small"
                                  onClick={(e) => handleOpenMenu(e, evaluation.id)}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                            subheader={
                              <Typography variant="body2" color="text.secondary">
                                {evaluation.subject} • {evaluation.group}
                              </Typography>
                            }
                          />
                          <CardContent sx={{ pt: 0, pb: 1 }}>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {evaluation.copies.length} copies corrigées
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={100} 
                                sx={{ height: 6, borderRadius: 3, my: 0.5 }}
                                color="success"
                              />
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              fullWidth
                              onClick={() => handleShowResults(evaluation.id)}
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
        </TabPanel>
      </Paper>
      
      {/* Menu de filtre */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleCloseFilterMenu}
      >
        <MenuItem>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="category-filter-label">Filtrer par catégorie</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              label="Filtrer par catégorie"
              fullWidth
            >
              <MenuItem value="">Toutes les catégories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>
      
      {/* Menu de tri */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleCloseSortMenu}
      >
        <MenuItem 
          onClick={() => handleSortChange('dueDate')}
          selected={sortBy === 'dueDate'}
        >
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trier par date d'échéance</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleSortChange('priority')}
          selected={sortBy === 'priority'}
        >
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trier par priorité</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleSortChange('name')}
          selected={sortBy === 'name'}
        >
          <ListItemIcon>
            <SortIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trier par nom</ListItemText>
        </MenuItem>
      </Menu>
      
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
        <MenuItem onClick={handleDeleteEvaluationClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Supprimer" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>
      
      {/* Dialogue de création/édition de tâche */}
      <TaskDialog
        open={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false);
          setCurrentTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={currentTask || undefined}
      />
      
      {/* Dialogue de confirmation de suppression de tâche */}
      <TaskDeleteDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={confirmDeleteTask}
        taskName={taskToDelete?.name || ''}
        isStarted={taskToDelete?.status !== 'pending'}
      />
      
      {/* Dialogue de création/édition d'évaluation */}
      <CreateEvaluationDialog
        open={isEvaluationDialogOpen}
        onClose={handleCloseCreateDialog}
        onSave={handleSaveEvaluation}
        initialEvaluation={editingEvaluation || undefined}
      />
      
      {/* Dialogue de confirmation de suppression d'évaluation */}
      <EvaluationDeleteDialog
        open={isEvaluationDeleteDialogOpen}
        onClose={() => setIsEvaluationDeleteDialogOpen(false)}
        onConfirm={confirmDeleteEvaluation}
        evaluationName={evaluationToDelete?.name || ''}
        hasGrades={Boolean(evaluationToDelete?.copies.some(copy => copy.grade !== null))}
      />
    </Box>
  );
};

export default TasksView;