// src/App.tsx - avec initialisation uniformisée

import React, { useEffect, useState } from 'react';
import {
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Container,
  Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import GradingIcon from '@mui/icons-material/Grading';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { blueGrey } from '@mui/material/colors';

import Dashboard from './components/dashboard/Dashboard';
import ScheduleView from './components/schedule/ScheduleView';
import TimeTableView from './components/schedule/TimeTableView';
import TasksView from './components/tasks/TasksView';
import teachQuestData from './data/teachquest-data';
import RubricsList from './components/rubrics/RubricsList';

import StudentsView from './components/students/StudentsView';
import InternshipsView from './components/internships/InternshipsView';
import CalendarManager from './components/schedule/CalendarManager';
import Settings from './components/settings/Settings';

// Services
import { storageService } from './services/storage.service';
import { scheduleService } from './services/schedule.service';
import { taskService } from './services/task.service';
import { evaluationService } from './services/evaluation.service';
import { studentService } from './services/student.service';
import { userService } from './services/user.service';

// Type pour les différentes vues de l'application
type AppView = 'dashboard' | 'schedule' | 'timetable' | 'tasks' | 'students' | 'internships' | 'rubrics' | 'settings' | 'calendar';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [pendingEvaluations, setPendingEvaluations] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);

        // Approche uniformisée pour l'initialisation
        if (!storageService.isInitialized()) {
          // Initialiser avec les données provenant de teachQuestData
          storageService.initializeStorage(teachQuestData);
        }

        // Recharger tous les services pour qu'ils utilisent les données actuelles
        scheduleService.reloadData();
        taskService.reloadData();
        studentService.reloadData();
        evaluationService.reloadData();
        userService.reloadData();
        
        // Mettre à jour les indicateurs pour l'interface
        updateNavigationIndicators();
        
        setInitialized(true);
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        setInitialized(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Mettre à jour les indicateurs pour la navigation
  const updateNavigationIndicators = () => {
    try {
      // Récupérer les évaluations en attente de correction
      const evaluations = evaluationService.getAllEvaluations();
      const pendingEvals = evaluations.filter(ev => {
        const progress = getEvaluationProgress(ev);
        return progress < 100;
      });
      setPendingEvaluations(pendingEvals.length);

      // Récupérer les tâches en attente
      const tasks = taskService.getAllTasks();
      const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
      setPendingTasks(pendingTasksCount);
    } catch (error) {
      console.error("Erreur lors du chargement des indicateurs:", error);
    }
  };

  // Calculer le taux de progression d'une évaluation
  const getEvaluationProgress = (evaluation: any): number => {
    if (!evaluation.copies || evaluation.copies.length === 0) {
      return 0;
    }

    const correctedCopies = evaluation.copies.filter((copy: any) => copy.grade !== null);
    return (correctedCopies.length / evaluation.copies.length) * 100;
  };

  // Afficher le composant correspondant à la vue actuelle
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <ScheduleView />;
      case 'calendar':
        return <CalendarManager />;
      case 'timetable':
        return <TimeTableView />;
      case 'tasks':
        return <TasksView />;
      case 'students':
        return <StudentsView />;
      case 'internships':
        return <InternshipsView />;
      case 'rubrics':
        return <RubricsList />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!initialized) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography variant="h5" color="error">
          Erreur lors de l'initialisation des données
        </Typography>
        <Typography>
          Vérifiez la console pour plus de détails ou essayez de rafraîchir la page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Barre d'application */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            TeachQuest
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Menu latéral */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton
              selected={currentView === 'dashboard'}
              onClick={() => setCurrentView('dashboard')}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Tableau de bord" />
            </ListItemButton>

            <ListItemButton
              selected={currentView === 'timetable'}
              onClick={() => setCurrentView('timetable')}
            >
              <ListItemIcon>
                <CalendarViewWeekIcon />
              </ListItemIcon>
              <ListItemText primary="Emploi du temps" />
            </ListItemButton>

            <ListItemButton
              selected={currentView === 'schedule'}
              onClick={() => setCurrentView('schedule')}
            >
              <ListItemIcon>
                <EventNoteIcon />
              </ListItemIcon>
              <ListItemText primary="Planning" />
            </ListItemButton>

            <ListItemButton
              selected={currentView === 'tasks'}
              onClick={() => setCurrentView('tasks')}
            >
              <ListItemIcon>
                <Badge badgeContent={pendingTasks} color="error" max={99}>
                  <AssignmentIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Tâches" />
            </ListItemButton>

            <ListItemButton
              selected={currentView === 'rubrics'}
              onClick={() => setCurrentView('rubrics')}
            >
              <ListItemIcon>
                <GradingIcon />
              </ListItemIcon>
              <ListItemText primary="Barèmes" />
            </ListItemButton>

            <ListItemButton
              selected={currentView === 'students'}
              onClick={() => setCurrentView('students')}
            >
              <ListItemIcon>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText primary="Élèves" />
            </ListItemButton>

            <ListItemButton
              selected={currentView === 'internships'}
              onClick={() => setCurrentView('internships')}
            >
              <ListItemIcon>
                <WorkIcon />
              </ListItemIcon>
              <ListItemText primary="Stages" />
            </ListItemButton>
          </List>

          <ListItemButton
            selected={currentView === 'calendar'}
            onClick={() => setCurrentView('calendar')}
          >
            <ListItemIcon>
              <CalendarMonthIcon />
            </ListItemIcon>
            <ListItemText primary="Calendrier scolaire" />
          </ListItemButton>
          <Divider />

          <List>
            <ListItemButton
              selected={currentView === 'settings'}
              onClick={() => setCurrentView('settings')}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Paramètres" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: blueGrey[50] }}>
        <Toolbar />
        <Container maxWidth="xl">
          {renderView()}
        </Container>
      </Box>
    </Box>
  );
}

export default App;