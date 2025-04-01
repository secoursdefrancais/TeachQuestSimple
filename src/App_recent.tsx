// src/App.tsx - version complète avec toutes les fonctionnalités

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
  Badge,
  Alert
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
import RubricsList from './components/rubrics/RubricsList';

import StudentsView from './components/students/StudentsView';
import InternshipsView from './components/internships/InternshipsView';
import CalendarManager from './components/schedule/CalendarManager';

// Services (pour obtenir des informations pour la navigation)
import { evaluationService } from './services/evaluation.service';
import { taskService } from './services/task.service';
import { storageService } from './services/storage.service'; 
import studentData from './data/student-data.json'

// Type pour les différentes vues de l'application
type AppView = 'dashboard' | 'schedule' | 'timetable' | 'tasks' | 'students' | 'internships' | 'rubrics' | 'settings' | 'calendar';


function App() {
    const [initialized, setInitialized] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [pendingEvaluations, setPendingEvaluations] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);


    useEffect(() => {
      const initializeApp = async () => {
          try {
              // Initialiser la base de données
              await storageService.initDB();

              // Importer les étudiants UNIQUEMENT si la base de données vient d'être initialisée.
              if (!(await storageService.isDatabaseInitialized())) {
                await storageService.importStudentsFromJson(studentData);
              }

              setInitialized(true);  // Marquer comme initialisé
          } catch (error: any) {
              console.error("Erreur critique lors de l'initialisation:", error);
              setInitError(error); // Stocker l'erreur
          }
      };

      initializeApp();
    }, []);

    // Charger les indicateurs pour la navigation (compte des tâches et évaluations en attente)
    useEffect(() => {
      const loadIndicators = async () => {
        if (initialized) {
          try {
            // Récupérer les évaluations en attente de correction
            const evaluations = await evaluationService.getAllEvaluations();
            const pendingEvals = evaluations.filter(ev => {
              const progress = getEvaluationProgress(ev);
              return progress < 100;
            });
            setPendingEvaluations(pendingEvals.length);

            // Récupérer les tâches en attente
            const tasks = await taskService.getAllTasks();
            const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
            setPendingTasks(pendingTasksCount);
          } catch (error) {
            console.error("Erreur lors du chargement des indicateurs:", error);
          }
        }
      };
      loadIndicators();
    }, [initialized]);


    // Calculer le taux de progression d'une évaluation (fonction utilitaire)
    const getEvaluationProgress = (evaluation: any): number => { //any car repris tel quel de l'ancien code.
        if (!evaluation.copies || evaluation.copies.length === 0) {
        return 0;
        }

        const correctedCopies = evaluation.copies.filter((copy: any) => copy.grade !== null);
        return (correctedCopies.length / evaluation.copies.length) * 100;
    };

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
                return <div>Paramètres (à implémenter)</div>;
            default:
                return <Dashboard />; // Par défaut, afficher le tableau de bord
        }
    };


  // Affichage conditionnel en fonction de l'état d'initialisation
  if (initError) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">
          <Typography variant="h5">
              Erreur critique lors de l'initialisation de la base de données.
          </Typography>
          <Typography>
              {initError.message}
          </Typography>
          <Typography>
              Veuillez vérifier votre configuration et recharger la page.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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